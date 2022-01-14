/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export type RequestID = number;

export interface PackedRequest {
  requestID: RequestID;
  request: Request;
}
export interface Request {
  call: APICall | InternalAPICall;
  args: any[];
}
export enum APICall {
  getDeviceDetails = "getDeviceDetails",
  getComponentList = "getComponentList",
  getComponent = "getComponent",
  getExtensions = "getExtensions",

  startComponent = "startComponent",
  stopComponent = "stopComponent",
  reinstallComponent = "reinstallComponent",
  getConfig = "getConfig",
  updateConfig = "updateConfig",

  subscribeToComponentList = "subscribeToComponentList",
  unsubscribeToComponentList = "unsubscribeToComponentList",
  subscribeToDependencyGraph = "subscribeToDependencyGraph",
  unsubscribeToDependencyGraph = "unsubscribeToDependencyGraph",
  subscribeToComponent = "subscribeToComponent",
  unsubscribeToComponent = "unsubscribeToComponent",
  subscribeToComponentLogs = "subscribeToComponentLogs",
  unsubscribeToComponentLogs = "unsubscribeToComponentLogs",
  subscribeToLogList = "subscribeToLogList",
  unsubscribeToLogList = "unsubscribeToLogList",
}
export enum InternalAPICall {
  init = "init",
  forcePushComponentList = "forcePushComponentList",
  forcePushDependencyGraph = "forcePushDependencyGraph",
  forcePushLogList = "forcePushLogList",
  ping = "ping",
}

export interface Message {
  messageType: MessageType;
  requestID: RequestID;
  payload: any;
}
export enum MessageType {
  RESPONSE,
  COMPONENT_LIST,
  DEPS_GRAPH,
  COMPONENT_CHANGE,
  COMPONENT_LOGS,
  LOG_LIST,
}

export interface DepGraphNode {
  name: string;
  children: Dependency[];
}
export interface Dependency {
  name: string;
  hard: boolean;
}

export interface ConfigMessage {
  successful: boolean;
  yaml: string;
  errorMsg: string;
}

export interface Log {
  name: string;
  log: string;
}

export interface DeferredPromise {
  promise: Promise<any>;
  race: Promise<any>;
  resolve: Function;
  reject: Function;
}
