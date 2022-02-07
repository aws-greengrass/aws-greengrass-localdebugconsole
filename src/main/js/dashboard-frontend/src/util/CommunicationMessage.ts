/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export class CommunicationMessage {
  topic: string;
  payload: string;
  constructor(
    topic: string,
    payload: string,
  ) {
    this.topic = topic;
    this.payload = payload;
  }
}
