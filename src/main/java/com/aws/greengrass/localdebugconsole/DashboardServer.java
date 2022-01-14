/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.aws.greengrass.localdebugconsole;

import com.aws.greengrass.deployment.DeviceConfiguration;
import com.aws.greengrass.lifecyclemanager.Kernel;
import com.aws.greengrass.localdebugconsole.messageutils.DeviceDetails;
import com.aws.greengrass.localdebugconsole.messageutils.LogItem;
import com.aws.greengrass.localdebugconsole.messageutils.Message;
import com.aws.greengrass.localdebugconsole.messageutils.MessageType;
import com.aws.greengrass.localdebugconsole.messageutils.PackedRequest;
import com.aws.greengrass.localdebugconsole.messageutils.Request;
import com.aws.greengrass.logging.api.Logger;
import com.aws.greengrass.logging.impl.config.LogConfig;
import com.aws.greengrass.util.DefaultConcurrentHashMap;
import com.aws.greengrass.util.Pair;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.Getter;
import org.apache.commons.io.input.Tailer;
import org.apache.commons.io.input.TailerListenerAdapter;
import org.java_websocket.WebSocket;
import org.java_websocket.exceptions.WebsocketNotConnectedException;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.inject.Provider;
import javax.inject.Singleton;
import javax.net.ssl.SSLEngine;

@Singleton
public class DashboardServer extends WebSocketServer implements KernelMessagePusher {
    static final String SERVER_START_MESSAGE = "Server started successfully";

    private final DashboardAPI dashboardAPI;
    private final Logger logger;
    private static final ObjectMapper jsonMapper = new ObjectMapper();

    private final CopyOnWriteArraySet<WebSocket> connections = new CopyOnWriteArraySet<>();
    private final DefaultConcurrentHashMap<String, Set<WebSocket>> statusWatchlist =
            new DefaultConcurrentHashMap<>(HashSet::new);
    private final DefaultConcurrentHashMap<String, Set<WebSocket>> logWatchlist =
            new DefaultConcurrentHashMap<>(HashSet::new);
    private final ConcurrentHashMap<String, Tailer> logTailers = new ConcurrentHashMap<>();

    @Getter(AccessLevel.PACKAGE)
    private final CompletableFuture<Object> started = new CompletableFuture<>();
    private final Authenticator authenticator;

    private final ExecutorService executorService = Executors.newCachedThreadPool();

    public DashboardServer(InetSocketAddress address, Logger logger, Kernel root, DeviceConfiguration deviceConfig,
                           Authenticator authenticator, Provider<SSLEngine> engineProvider) {
        this(address, logger, new KernelCommunicator(root, logger, deviceConfig), authenticator, engineProvider);
    }

    // constructor for unit testing
    DashboardServer(InetSocketAddress address, Logger logger, DashboardAPI dashboardAPI, Authenticator authenticator,
                    Provider<SSLEngine> engineProvider) {
        super(address);
        setReuseAddr(true);
        setTcpNoDelay(true);
        if (engineProvider != null) {
            setWebSocketFactory(new GGSSLWebSocketServerFactory(engineProvider));
        }
        this.logger = logger;
        this.dashboardAPI = dashboardAPI;
        this.authenticator = authenticator;
        this.logger.atInfo().log("Starting dashboard server on address: {}", address);
    }

    // links the API impl and starts the socket server
    void startup() {
        if (dashboardAPI instanceof KernelCommunicator) {
            ((KernelCommunicator) dashboardAPI).linkWithPusher(this);
            ((KernelCommunicator) dashboardAPI).linkWithKernel();
        }
        start();
    }

    // for use in testing only
    void clearSubscriptions() {
        statusWatchlist.clear();
        logWatchlist.clear();
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        conn.setAttachment(false);
        connections.add(conn);
        logger.atInfo().log("New connection from {}", conn.getRemoteSocketAddress());
    }

    @Override
    public void onMessage(WebSocket conn, String msg) {
        PackedRequest packedRequest;
        try {
            packedRequest = jsonMapper.readValue(msg, PackedRequest.class);
        } catch (JsonProcessingException e) {
            logger.atError().setCause(e).log("Unable to process the incoming message: {}", msg);
            return;
        }
        Request req = packedRequest.request;
        logger.atDebug().kv("Call", req.call).kv("Socket", conn.getRemoteSocketAddress()).log("Client API call");

        APICalls call;
        try {
            call = APICalls.valueOf(req.call);
        } catch (IllegalArgumentException e) { // if not a valid call, then echo
            sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, req.call));
            return;
        }

        // initialize connection
        if (APICalls.init.equals(call)) {
            logger.atDebug().log("Client connection init");
            String echoResponse = null;
            if (req.args.length != 2 || !authenticator.isUsernameAndPasswordValid(new Pair<>(req.args[0], req.args[1]))) {
                logger.atError().log("Websocket connection is not authenticated");
                try {
                    echoResponse = jsonMapper.writeValueAsString(new Message(MessageType.RESPONSE,
                            packedRequest.requestID, "Not authenticated"));
                    conn.send(echoResponse);
                } catch (JsonProcessingException e) {
                    logger.atError().setCause(e).log("Unable to stringify the message: {}", echoResponse);
                }
                return;
            }
            // Set attachment to true meaning that the client has been authenticated
            conn.setAttachment(true);
            try {
                echoResponse = jsonMapper.writeValueAsString(new Message(MessageType.RESPONSE,
                        packedRequest.requestID, true));
                conn.send(echoResponse);
            } catch (JsonProcessingException j) {
                logger.atError().setCause(j).log("Unable to stringify the message: {}", echoResponse);
            }
        } else {
            switch (call) {
                case getDeviceDetails: {
                    DeviceDetails deviceDetails = dashboardAPI.getDeviceDetails();
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, deviceDetails));
                    break;
                }
                case getComponentList: {
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID,
                            dashboardAPI.getComponentList()));
                    break;
                }
                case getComponent: {
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID,
                            dashboardAPI.getComponent(req.args[0])));
                    break;
                }

                case getExtensions: {
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID,
                            dashboardAPI.getExtensions(req.args[0], req.args[1])));
                    break;
                }

                case startComponent: {
                    boolean retval = dashboardAPI.startComponent(req.args[0]);
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, retval));
                    break;
                }
                case stopComponent: {
                    boolean retval = dashboardAPI.stopComponent(req.args[0]);
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, retval));
                    break;
                }
                case reinstallComponent: {
                    boolean retval = dashboardAPI.reinstallComponent(req.args[0]);
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, retval));
                    break;
                }
                case getConfig: {
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID,
                            dashboardAPI.getConfig(req.args[0])));
                    break;
                }
                case updateConfig: {
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID,
                            dashboardAPI.updateConfig(req.args[0], req.args[1])));
                    break;
                }

                case subscribeToComponent: {
                    statusWatchlist.get(req.args[0]).add(conn);
                    pushComponentChange(req.args[0]);
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, true));
                    break;
                }
                case unsubscribeToComponent: {
                    removeFromMapOfLists(statusWatchlist, req.args[0], conn);
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, true));
                    break;
                }
                case subscribeToComponentLogs: {
                    String logFile = req.args[0];
                    logWatchlist.get(logFile).add(conn);
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, true));
                    if (!logTailers.containsKey(logFile)) {
                        startLogTailer(logFile);
                    }
                    break;
                }
                case unsubscribeToComponentLogs: {
                    String logFile = req.args[0];
                    logWatchlist.get(logFile).remove(conn);
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, true));

                    // Remove the mapping if that was the last conn.
                    // Doing this instead of removeFromMapOfLists because logWatchlist is a DefaultConcurrentHashMap
                    // so containsKey always return true.
                    // Therefore, must tap into computeIfPresent to know lastConnRemoved
                    AtomicBoolean lastConnRemoved = new AtomicBoolean(false);
                    logWatchlist.computeIfPresent(logFile, (k, v) -> {
                        if (v.isEmpty()) {
                            lastConnRemoved.set(true);
                            return null;
                        }
                        return v;
                    });

                    // Stop the tailer if there's no watchers left
                    if (lastConnRemoved.get()) {
                        logTailers.computeIfPresent(logFile, (k, tailer) -> {
                            tailer.stop();
                            logger.debug("Stopped tailer for: {}", logFile);
                            return null;
                        });
                    }
                    break;
                }
                case forcePushComponentList: {
                    pushComponentListUpdate();
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, true));
                    break;
                }
                case forcePushDependencyGraph: {
                    pushDependencyGraphUpdate();
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, true));
                    break;
                }
                case forcePushLogList: {
                    pushLogList();
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, true));
                    break;
                }
                default: { // echo
                    sendIfOpen(conn, new Message(MessageType.RESPONSE, packedRequest.requestID, req.call));
                    break;
                }
            }
        }
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        connections.remove(conn);
        statusWatchlist.forEach((name, set) -> set.remove(conn));
        logWatchlist.forEach((name, set) -> {
            set.remove(conn);
            // If no watchers left, stop the log tailer as well.
            if (set.size() == 0) {
                logTailers.computeIfPresent(name, (k, tailer) -> {
                    tailer.stop();
                    logger.debug("Stopped tailer for: {}", name);
                    return null;
                });
            }
        });
        logger.atInfo()
                .log("closed {} with exit code {}, additional info: {}", conn.getRemoteSocketAddress(), code, reason);
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        logger.atError().setCause(ex).log("an error occurred on connection {}",
                conn == null ? null : conn.getRemoteSocketAddress());
    }

    @Override
    public void onStart() {
        logger.atInfo().log(SERVER_START_MESSAGE);
        started.complete(null);
    }

    @Override
    public void pushComponentListUpdate() {
        for (WebSocket conn : connections) {
            sendIfOpen(conn, new Message(MessageType.COMPONENT_LIST, -1, dashboardAPI.getComponentList()));
        }
    }

    @Override
    public void pushComponentChange(String name) {
        if (statusWatchlist.containsKey(name)) {
            statusWatchlist.computeIfPresent(name, (k,set) -> {
                for (WebSocket conn : set) {
                    sendIfOpen(conn, new Message(MessageType.COMPONENT_CHANGE, -1, dashboardAPI.getComponent(name)));
                }
                return set;
            });
        }
    }

    @Override
    public void pushDependencyGraphUpdate() {
        for (WebSocket conn : connections) {
            sendIfOpen(conn, new Message(MessageType.DEPS_GRAPH, -1, dashboardAPI.getDependencyGraph()));
        }
    }

    @Override
    public void pushLogList() {
        String[] logList = dashboardAPI.getLogList();
        for (WebSocket conn : connections) {
            sendIfOpen(conn, new Message(MessageType.LOG_LIST, -1, logList));
        }
    }

    void removeFromMapOfLists(Map<String, Set<WebSocket>> map, String key, WebSocket entry) {
        map.get(key).remove(entry);
        map.computeIfPresent(key, (k, v) -> {
            if (v.isEmpty()) {
                return null;
            }
            return v;
        });
    }

    private void sendIfOpen(WebSocket conn, Message msg) {
        if (conn != null && (boolean) conn.getAttachment()) {
            try {
                String temp = jsonMapper.writeValueAsString(msg);
                conn.send(temp);
            } catch (WebsocketNotConnectedException e) {
                // a normal occurrence if the dashboard is not connected, e.g. if the user closes the browser
            } catch (JsonProcessingException j) {
                logger.atError().setCause(j).log("Unable to stringify the message: {}", msg);
            }
        }
    }

    private void startLogTailer(String logFilename) {
        Path logDir = LogConfig.getRootLogConfig().getStoreDirectory().toAbsolutePath();
        Path logFilePath = logDir.resolve(logFilename);
        if (!Files.exists(logFilePath)) {
            logger.error("Cannot start log tailer. The log file {} doesn't exist", logFilename);
            return;
        }
        Tailer tailer = new Tailer(logFilePath.toFile(), new TailerListenerAdapter() {
            @Override
            public void handle(String line) {
                pushLogLine(logFilename, line);
            }

            @Override
            public void handle(Exception e) {
                logger.atError().cause(e).log("Error tailing file {}", logFilename);
            }
        });
        executorService.submit(tailer);
        logTailers.put(logFilename, tailer);
    }

    private void pushLogLine(String logName, String logLine) {
        if (logWatchlist.containsKey(logName)) {
            for (WebSocket conn : logWatchlist.get(logName)) {
                sendIfOpen(conn, new Message(MessageType.COMPONENT_LOGS, -1, new LogItem(logName, logLine)));
            }
        }
    }
}
