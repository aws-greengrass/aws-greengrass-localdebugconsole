/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from "react";
import {Header} from "@awsui/components-react";
import PubSubDebugger from "./PubSubDebugger";

/**
 * Custom view for PubSub/MQTT debugger
 */
class PubSub extends Component {
  render() {
    return (
      <>
        <div className="awsui-grid">
          <div className="awsui-row">
              <div className="col-12 col-l-8 col-xl-6">
                  <PubSubDebugger title="PubSub Debugger" />
              </div>
          </div>
        </div>
      </>
    );
  }
}

export default PubSub;
