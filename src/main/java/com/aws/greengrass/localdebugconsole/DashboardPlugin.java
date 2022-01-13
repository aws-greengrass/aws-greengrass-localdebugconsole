/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.aws.greengrass.localdebugconsole;

import com.aws.greengrass.localdebugconsole.messageutils.Message;
import com.aws.greengrass.localdebugconsole.messageutils.PackedRequest;
import org.java_websocket.WebSocket;

import java.net.URL;
import java.util.function.Consumer;

public interface DashboardPlugin {
    String getPluginPath(String pageType);

    URL getResourceURL(String requestPath);

    String getApiServiceName();

    void onMessage(PackedRequest packedRequest, Consumer<Message> sendIfOpen, WebSocket conn);

    void onConnectionClose(WebSocket conn);
}
