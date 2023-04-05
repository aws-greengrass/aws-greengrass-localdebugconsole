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
    Header, Icon,
    Input, Link,
    SpaceBetween,
    Table,
    Tabs, Textarea,
} from "@cloudscape-design/components";

import {SERVER} from "../index";
import {APICall} from "../util/CommUtils";
import {CommunicationMessage} from "../util/CommunicationMessage";

interface ServiceTableProps {
    title: string;
}

interface Message {
    binaryPayload: string;
    received: Date;
}

interface PubSubState {
    selectedTopic: string,
    topicInputValue: string,
    messageInputValue: string,
    topicsAndMessages: { [key: string]: Message[] },
}

class PubSubDebugger extends Component<any & ServiceTableProps,
    PubSubState> {
    state: PubSubState = {
        selectedTopic: "",
        topicInputValue: "",
        messageInputValue: "",
        topicsAndMessages: {},
    };

    async componentDidMount() {
        await SERVER.initConnections();
    }

    handleNewMessage = (message: CommunicationMessage) => {
        const messageList = this.state.topicsAndMessages[message.topic];
        messageList.push({binaryPayload: message.payload, received: new Date()});
        this.setState({
            topicsAndMessages: {
                ...this.state.topicsAndMessages,
                [message.topic]: messageList,
            }
        })
    };

    onTopicSelectionChange(e: any) {
        this.setState({
            selectedTopic: e.detail.selectedItems[0]
        });
    }

    onTopicInputValueChange(topic: string) {
        this.setState({topicInputValue: topic});
    }

    onMessageInputValueChange(message: string) {
        this.setState({messageInputValue: message});
    }

    onSubscribeTopicSubmit() {
        const topic = this.state.topicInputValue;
        if (topic in this.state.topicsAndMessages) {
            return;
        }

        this.setState({
            selectedTopic: topic,
            topicsAndMessages: {
                ...this.state.topicsAndMessages,
                [topic]: []
            }
        })
        SERVER.sendSubscriptionMessage(
            {call: APICall.subscribeToPubSubTopic, args: [this.state.topicInputValue]},
            this.handleNewMessage
        );
    }

    onPublishTopicSubmit() {
        SERVER.sendRequest({
            call: APICall.publishToPubSubTopic,
            args: [this.state.topicInputValue, this.state.messageInputValue],
        });
    }

    unsubscribeFromTopic(topic: string) {
        if (!(topic in this.state.topicsAndMessages)) {
            return;
        }

        delete this.state.topicsAndMessages[topic];
        const topics = Object.keys(this.state.topicsAndMessages);
        let newTopic = "";
        if (topics.length !== 0) {
            newTopic = topics[0];
        }
        this.setState({
            selectedTopic: this.state.selectedTopic === topic ? newTopic : topic,
            topicsAndMessages: {
                ...this.state.topicsAndMessages
            }
        })
        SERVER.sendSubscriptionMessage(
            {call: APICall.unsubscribeToPubSubTopic, args: [topic]},
            this.handleNewMessage
        );
    }

    render() {
        const tabs = [
            {
                id: "tab1",
                label: "Subscribe to a topic",
                content: (
                    <Form
                        actions={
                            <Button variant="primary" onClick={this.onSubscribeTopicSubmit.bind(this)}>Subscribe</Button>
                        }
                    >
                        <SpaceBetween direction="vertical" size="l">
                            <FormField label="Topic" description="The PubSub topic filter to subscribe to">
                                <Input
                                    placeholder="Topic filter"
                                    value={this.state.topicInputValue}
                                    onChange={event =>
                                        this.onTopicInputValueChange(event.detail.value)
                                    }
                                />
                            </FormField>
                        </SpaceBetween>
                    </Form>
                ),
            },
            {
                id: "tab2",
                label: "Publish to a topic",
                content: (
                    <Form
                        actions={
                            <Button variant="primary" onClick={this.onPublishTopicSubmit.bind(this)}>Publish</Button>
                        }
                    >
                        <SpaceBetween direction="vertical" size="l">
                            <FormField label="Topic" description="The PubSub topic to publish on">
                                <Input
                                    value={this.state.topicInputValue}
                                    onChange={event =>
                                        this.onTopicInputValueChange(event.detail.value)
                                    }
                                />
                            </FormField>
                            <FormField label="Message payload">
                                <Textarea
                                    value={this.state.messageInputValue}
                                    onChange={event =>
                                        this.onMessageInputValueChange(event.detail.value)
                                    }
                                />
                            </FormField>
                        </SpaceBetween>
                    </Form>
                ),
            },
        ];

        return (
            <Box padding={{top: "m"}}>
                <SpaceBetween direction="vertical" size="l">
                    <Container>
                        <Tabs tabs={tabs}></Tabs>
                    </Container>
                    <Container header={<Header variant="h2">Subscriptions</Header>}>
                        <Grid gridDefinition={[
                            {colspan: {xxs: 4}},
                            {colspan: {xxs: 8}},
                        ]}>
                            <Table
                                columnDefinitions={[
                                    {
                                        id: "variable",
                                        header: "Topic",
                                        cell: (e) => {
                                            return <span>{e}<Box float="right"><Link onFollow={() => {
                                                this.unsubscribeFromTopic(e);
                                            }
                                            }><Icon variant={"warning"} name={"close"}/></Link></Box></span>;
                                        },
                                        sortingField: "topic"
                                    },
                                ]}
                                onSelectionChange={this.onTopicSelectionChange.bind(this)}
                                selectedItems={[this.state.selectedTopic]}
                                items={Object.keys(this.state.topicsAndMessages)}
                                selectionType="single"
                                empty={
                                    <Box textAlign="center" color="inherit">
                                        <b>No subscriptions</b>
                                    </Box>
                                }
                                sortingDisabled={true}
                            />
                            <Table
                                columnDefinitions={[
                                    {
                                        id: "variable",
                                        header: "Message",
                                        cell: (m) => {
                                            return <pre>{m.binaryPayload}</pre>
                                        },
                                        width: "100%"
                                    },
                                    {
                                        id: "date",
                                        header: "Receive time",
                                        cell: (m: Message) => {
                                            return m.received.toLocaleTimeString();
                                        }
                                    }
                                ]}
                                items={this.state.topicsAndMessages[this.state.selectedTopic]?.slice()?.reverse()}
                                empty={
                                    <Box textAlign="center" color="inherit">
                                        <b>No messages</b>
                                    </Box>
                                }
                            />
                        </Grid>
                    </Container>
                </SpaceBetween>
            </Box>
        );
    }
}

export default withRouter(PubSubDebugger);
