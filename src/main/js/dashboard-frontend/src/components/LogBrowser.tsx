/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {Component} from "react";
import {
  Container,
  Select,
  Table
} from "@awsui/components-react";
import {SERVER} from "../index";
import {APICall} from "../util/CommUtils";
import {SelectProps} from "@awsui/components-react/select";

interface LogTableItem {
  a: String
}

interface ServiceTableState {
  logFileOptions: SelectProps.Option[],
  selectedOption: SelectProps.Option | null,
  logItems: LogTableItem[],
}

class LogBrowser extends Component {

  state: ServiceTableState = {
    logFileOptions: [],
    selectedOption: null,
    logItems: [],
  }

  async componentDidMount() {
    // start subscription to log file list
    await SERVER.initConnections();
    console.log("subscribeToLogList");
    SERVER.sendSubscriptionMessage(
      {call: APICall.subscribeToLogList, args: []},
      this.handleServerPushLogList
    ).catch((e) => console.error("Cannot subscribe to log list updates", e));
  }

  async componentWillUnmount() {
    console.log("Log browser will unmount");

    // unsubscribe to everything
    await SERVER.sendSubscriptionMessage(
      {call: APICall.unsubscribeToComponentList, args: []},
      this.handleServerPushLogList
    ).catch((e) => console.error("Failed to un-subscribe", e));

    await this.unsubscribeToSelectedLog();
  }

  async unsubscribeToSelectedLog() {
    if (this.state.selectedOption !== null) {
      const unsubLogName = this.state.selectedOption.value;
      console.log("un-sub log: ", unsubLogName);
      await SERVER.sendSubscriptionMessage(
        {call: APICall.unsubscribeToComponentLogs, args: [unsubLogName]},
        this.handleServerPushComponentLog
      ).catch((e) => console.error("Cannot un-subscribe component logs", e));
    }
  }

  handleServerPushLogList = (logList: String[]) => {
    const options = logList.map((filename) => {
      return {"label": filename, "value": filename}
    })
    this.setState({logFileOptions: options});
  };

  async onLogSelectionChange(event: any) {
    const selectedLogName = event.detail.selectedOption.value;
    await this.unsubscribeToSelectedLog();

    this.setState({selectedOption: event.detail.selectedOption, logItems: []});
    SERVER.sendSubscriptionMessage(
      {call: APICall.subscribeToComponentLogs, args: [selectedLogName]},
      this.handleServerPushComponentLog
    ).catch((e) => console.error("Cannot subscribe to component logs", e));
  }

  handleServerPushComponentLog = (s: String) => {
    this.setState({logItems: [...this.state.logItems, {a: s}]})
  };

  render() {
    return (
      <Container header={<h2>Logs</h2>}>
        <Select
          selectedOption={this.state.selectedOption}
          onChange={this.onLogSelectionChange.bind(this)}
          options={this.state.logFileOptions}
          empty="No log file found"
          placeholder="Select a log file"
        />
        <Table
          loadingText="Loading log file"
          columnDefinitions={[{
            id: "log",
            header: "",
            cell: (e: LogTableItem) => e.a,
          },]}
          items={this.state.logItems}
          // filter={
          //   <TextFilter
          //     filteringPlaceholder="Search"
          //     filteringText=""
          //   />
          // }
          // pagination={
          //   <Pagination
          //     currentPageIndex={1}
          //     pagesCount={2}
          //     ariaLabels={{
          //       nextPageLabel: "Next page",
          //       previousPageLabel: "Previous page",
          //       pageLabel: pageNumber =>
          //         `Page ${pageNumber} of all pages`
          //     }}
          //   />
          // }
          // preferences={
          //   <CollectionPreferences
          //     title="Preferences"
          //     confirmLabel="Confirm"
          //     cancelLabel="Cancel"
          //     preferences={{
          //       pageSize: 10,
          //     }}
          //     pageSizePreference={{
          //       title: "Select page size",
          //       options: [
          //         {value: 10, label: "10 lines"},
          //         {value: 20, label: "20 lines"}
          //       ]
          //     }}
          //   />
          // }
        />
      </Container>
    );
  }
}

export default LogBrowser;
