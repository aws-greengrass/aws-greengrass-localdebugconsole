/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {Component} from "react";
import {withRouter} from "react-router-dom";

import {
    Box,
    Button,
    Container,
    Form,
    FormField,
    Grid,
    Header,
    Input,
    SpaceBetween,
    Table,
    Tabs,
} from "@cloudscape-design/components";

import {SERVER} from "../index";
import {APICall} from "../util/CommUtils";
import {CommunicationMessage} from "../util/CommunicationMessage";

interface ServiceTableProps {
    title: string;
}

interface PubSubState {
  items: string[]; // Subscribed Topics
  selectedItems: string[];
  messages: string[];
  topicInputValue: string,
  messageInputValue: string,
}

/**
 * Custom view for GG component tables
 */

class PubSubDebugger extends Component<any & ServiceTableProps,
    PubSubState> {
  state: PubSubState = {
    items: [],
    selectedItems: [],
    messages: [],
    topicInputValue: "Topic to subscirbe here...",
    messageInputValue: "Message to publish here...",
  };

  topicsAndMessages: { [key: string]: string[]} = {};

  async componentDidMount() {
    await SERVER.initConnections();
  }

  handleNewMessage = (message: CommunicationMessage) => {
      console.log("in handleNew message");
      this.topicsAndMessages[message.topic].push(message.payload);
      if (message.topic === this.state.selectedItems[0]) {
          this.setState({messages: Object.assign([], this.topicsAndMessages[message.topic])})
      }
  };

  onTopicSelectionChange(e: any) {
    let topic = e.detail.selectedItems[0];
    // TODO: not push
    this.setState({
        selectedItems: e.detail.selectedItems,
        messages: Object.assign([], this.topicsAndMessages[topic])
    });
    console.log("onTopicSelectChange: ", e.detail.selectedItems);
  }

  onTopicInputValueChange(topic: string) {
       this.setState({topicInputValue: topic});
  }

  onMessageInputValueChange(message: string) {
       this.setState({messageInputValue: message});
  }

  onSubscribeTopicSubmit() {
      const topic = this.state.topicInputValue;
      if (topic in this.topicsAndMessages) return;

      this.topicsAndMessages[topic] = [];
      this.setState({
          items: Object.keys(this.topicsAndMessages),
          selectedItems: [topic],
          messages: [],
      })
      SERVER.sendSubscriptionMessage(
          {call: APICall.subscribeToPubSubTopic, args: [this.state.topicInputValue]},
          this.handleNewMessage
      ).catch((reason) => {
          console.log("Error: " + reason);
      });
      console.log("In onSubscribeTopicSubmit: ", this.state.topicInputValue);
  }

  onPublishTopicSubmit() {
      SERVER.sendRequest({
          call: APICall.publishToPubSubTopic,
          args: [this.state.topicInputValue, this.state.messageInputValue],
      });
      console.log("In onPublishTopicSubmit: ", this.state.topicInputValue, ": ", this.state.messageInputValue);
  }

  onUnsubscribeTopicSubmit() {
      const topic = this.state.topicInputValue;
      if (! (topic in this.topicsAndMessages)) return;

      delete this.topicsAndMessages[topic];
      const topics = Object.keys(this.topicsAndMessages);
      let newTopic = "";
      let selectedItems: string[] = [];
      let messages: string[] = [];
      if (topics.length !== 0 ) {
          newTopic = topics[0];
          selectedItems = [newTopic];
          messages = this.topicsAndMessages[newTopic];
      }
      this.setState({
          items: topics,
          selectedItems: selectedItems,
          messages: messages,
      })
      SERVER.sendSubscriptionMessage(
          {call: APICall.unsubscribeToPubSubTopic, args: [topic]},
          this.handleNewMessage
      ).catch((reason) => {
          console.log("Error: " + reason);
      });
  }

  render() {
    const tabs = [
      {
        id: "tab1",
        label: "Subscribe to a topic",
        content: (
          <form onSubmit={this.onSubscribeTopicSubmit.bind(this)}>
              <Form
                  actions={
                      <Button variant="primary">Submit</Button>
                  }
              >
                  <SpaceBetween direction="vertical" size="l">
                      <FormField label="Topic" description="The PubSub topic to subscribe">
                          <Input
                              value={this.state.topicInputValue}
                              onChange={event =>
                                  this.onTopicInputValueChange(event.detail.value)
                              }
                          />
                      </FormField>
                  </SpaceBetween>
              </Form>
          </form>
        ),
      },
      {
        id: "tab2",
        label: "Publish to a topic",
        content: (
            <form onSubmit={this.onPublishTopicSubmit.bind(this)}>
                <Form
                    actions={
                        <Button variant="primary">Submit</Button>
                    }
                >
                    <SpaceBetween direction="vertical" size="l">
                        <FormField label="Topic" description="The PubSub topic to subscribe">
                            <Input
                                value={this.state.topicInputValue}
                                onChange={event =>
                                    this.onTopicInputValueChange(event.detail.value)
                                }
                            />
                        </FormField>
                        <FormField label="Message payload">
                            <Input
                                value={this.state.messageInputValue}
                                onChange={event =>
                                    this.onMessageInputValueChange(event.detail.value)
                                }
                            />
                        </FormField>
                    </SpaceBetween>
                </Form>
            </form>
        ),
      },
      {
        id: "tab3",
        label: "Unsubscribe a topic",
        content: (
          <form onSubmit={this.onUnsubscribeTopicSubmit.bind(this)}>
              <Form
                  actions={
                      <Button variant="primary">Submit</Button>
                  }
              >
                  <SpaceBetween direction="vertical" size="l">
                      <FormField label="Topic" description="The PubSub topic to subscribe">
                          <Input
                              value={this.state.topicInputValue}
                              onChange={event =>
                                  this.onTopicInputValueChange(event.detail.value)
                              }
                          />
                      </FormField>
                  </SpaceBetween>
              </Form>
          </form>
        ),
      },
    ];

    const messagesList = this.state.messages.map((message) =>
        <li>{message}</li>
    )

    return (
        <Container>
          <SpaceBetween direction="vertical" size="l">
            <Container>
              <Tabs tabs={tabs}></Tabs>
            </Container>
            <Container header={<Header variant="h2">Subscriptions </Header>}>
              <Grid gridDefinition={[
                { colspan: { xxs: 4 } },
                { colspan: { xxs: 8 } },
              ]}>
                  <Table
                      ariaLabels={{
                          selectionGroupLabel: "Items selection",
                          allItemsSelectionLabel: ({ selectedItems }) =>
                              `${selectedItems.length} ${
                                  selectedItems.length === 1 ? "item" : "items"
                              } selected`,
                          itemSelectionLabel: ({ selectedItems }, item) => {
                              const isItemSelected = selectedItems.filter(
                                  i =>  i === item
                              ).length;
                              return `${item} is ${
                                  isItemSelected ? "" : "not"
                              } selected`;
                          }
                      }}
                      columnDefinitions={[
                          {
                              id: "variable",
                              header: "Topic",
                              cell: e => e,
                              sortingField: "topic"
                          },
                      ]}
                      onSelectionChange={this.onTopicSelectionChange.bind(this)}
                      selectedItems={this.state.selectedItems}
                      items={this.state.items}
                      loadingText="Loading resources"
                      selectionType="single"
                      visibleColumns={[
                          "variable",
                          "value",
                          "type",
                          "description"
                      ]}
                      empty={
                          <Box textAlign="center" color="inherit">
                              <b>No resources</b>
                              <Box
                                  padding={{ bottom: "s" }}
                                  variant="p"
                                  color="inherit"
                              >
                                  No resources to display.
                              </Box>
                              <Button>Create resource</Button>
                          </Box>
                      }
                  />
                  <Table
                      columnDefinitions={[
                          {
                              id: "variable",
                              header: "Message",
                              cell: e => e
                          },
                      ]}
                      items={this.state.messages}
                      loadingText="Loading resources"
                      visibleColumns={[
                          "variable",
                      ]}
                      empty={
                          <Box textAlign="center" color="inherit">
                              <b>No resources</b>
                              <Box
                                  padding={{ bottom: "s" }}
                                  variant="p"
                                  color="inherit"
                              >
                                  No resources to display.
                              </Box>
                              <Button>Create resource</Button>
                          </Box>
                      }
                  />
              </Grid>
            </Container>
          </SpaceBetween>
        </Container>
    );
  }
}

export default withRouter(PubSubDebugger);
