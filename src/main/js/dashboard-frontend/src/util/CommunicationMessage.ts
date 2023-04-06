/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export class CommunicationMessage {
  subscribedTopic: string;
  topic: string;
  payload: string;
  constructor(
    subscribedTopic: string,
    topic: string,
    payload: string,
  ) {
    this.subscribedTopic = subscribedTopic;
    this.topic = topic;
    this.payload = payload;
  }
}
