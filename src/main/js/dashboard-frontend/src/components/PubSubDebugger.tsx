/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useCallback, useRef, useState} from "react";
import {withRouter} from "react-router-dom";

import {
    Box,
    Button, CollectionPreferences, CollectionPreferencesProps,
    Container,
    ContentLayout,
    Form,
    FormField,
    Grid,
    Header,
    Icon,
    Input,
    Link, Pagination,
    SpaceBetween,
    Table,
    Tabs,
    Textarea,
} from "@cloudscape-design/components";

import {SERVER} from "../index";
import {APICall} from "../util/CommUtils";
import {CommunicationMessage} from "../util/CommunicationMessage";
import {useCollection} from "@cloudscape-design/collection-hooks";

interface Message {
    binaryPayload: string;
    received: Date;
    topic: string;
}

const PubSub = () => {
    const [selectedTopic, setSelectedTopic] = useState("");
    const [topicInputValue, setTopicInputValue] = useState("");
    const [messageInputValue, setMessageInputValue] = useState("");
    const [topicsAndMessages, setTopicsAndMessages] = useState<{ [key: string]: Message[] }>({});
    const topicsAndMessagesRef = useRef<typeof topicsAndMessages>();
    topicsAndMessagesRef.current = topicsAndMessages

    const handleNewMessage = useCallback((message: CommunicationMessage) => {
        const messageList = topicsAndMessagesRef.current![message.subscribedTopic];
        messageList.push({binaryPayload: message.payload, received: new Date(), topic: message.topic});
        setTopicsAndMessages((old) => ({
            ...old,
            [message.subscribedTopic]: messageList,
        }));
    }, [topicsAndMessagesRef]);

    const onSubscribeTopicSubmit = () => {
        const topic = topicInputValue;
        if (topic in topicsAndMessages) {
            return;
        }

        setSelectedTopic(topic);
        setTopicsAndMessages((old) => ({
            ...old,
            [topic]: []
        }));
        SERVER.sendSubscriptionMessage(
            {call: APICall.subscribeToPubSubTopic, args: [topicInputValue]},
            handleNewMessage
        );
    }

    const unsubscribeFromTopic = (topic: string) => {
        if (!(topic in topicsAndMessages)) {
            return;
        }

        delete topicsAndMessages[topic];
        const topics = Object.keys(topicsAndMessages);
        let newTopic = "";
        if (topics.length !== 0) {
            newTopic = topics[0];
        }
        setSelectedTopic(selectedTopic === topic ? newTopic : topic);
        setTopicsAndMessages({...topicsAndMessages});
        SERVER.sendSubscriptionMessage(
            {call: APICall.unsubscribeToPubSubTopic, args: [topic]},
            handleNewMessage
        );
    }

    const tabs = [
        {
            id: "tab1",
            label: "Subscribe to a topic",
            content: (
                <Form
                    actions={
                        <Button variant="primary" onClick={onSubscribeTopicSubmit}>Subscribe</Button>
                    }
                >
                    <SpaceBetween direction="vertical" size="l">
                        <FormField label="Topic" description="The PubSub topic filter to subscribe to">
                            <Input
                                placeholder="Topic filter"
                                value={topicInputValue}
                                onChange={event =>
                                    setTopicInputValue(event.detail.value)
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
                        <Button variant="primary" onClick={() => {
                            SERVER.sendRequest({
                                call: APICall.publishToPubSubTopic,
                                args: [topicInputValue, messageInputValue],
                            });
                        }}>Publish</Button>
                    }
                >
                    <SpaceBetween direction="vertical" size="l">
                        <FormField label="Topic" description="The PubSub topic to publish on">
                            <Input
                                value={topicInputValue}
                                onChange={event =>
                                    setTopicInputValue(event.detail.value)
                                }
                            />
                        </FormField>
                        <FormField label="Message payload">
                            <Textarea
                                value={messageInputValue}
                                onChange={event =>
                                    setMessageInputValue(event.detail.value)
                                }
                            />
                        </FormField>
                    </SpaceBetween>
                </Form>
            ),
        },
    ];

    const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
        pageSize: 100,
        visibleContent: ["topic", "date", "message"]
    });
    const {items, collectionProps, paginationProps} =
        useCollection(topicsAndMessages[selectedTopic]?.slice().reverse() || [],
            {
                pagination: {pageSize: preferences.pageSize},
                sorting: {
                    defaultState: {
                        sortingColumn: {
                            sortingField: "date",
                        },
                        isDescending: true
                    }
                },
            });

    return (
        <ContentLayout header={<Header variant={"h1"}>PubSub test client</Header>}>
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
                                            unsubscribeFromTopic(e);
                                        }
                                        }><Icon variant={"warning"} name={"close"}/></Link></Box></span>;
                                    },
                                    sortingField: "topic"
                                },
                            ]}
                            onSelectionChange={(e: any) => {
                                setSelectedTopic(e.detail.selectedItems[0]);
                            }}
                            selectedItems={[selectedTopic]}
                            items={Object.keys(topicsAndMessages)}
                            selectionType="single"
                            empty={
                                <Box textAlign="center" color="inherit">
                                    <b>No subscriptions</b>
                                </Box>
                            }
                            sortingDisabled={true}
                        />
                        <Table
                            {...collectionProps}
                            resizableColumns={true}
                            header={<Header
                                actions={<Button iconName={"close"} disabled={selectedTopic === ""} onClick={() => {
                                    setTopicsAndMessages(old => {
                                        return {...old, [selectedTopic]: []}
                                    });
                                }
                                }>Clear all</Button>}/>}
                            columnDefinitions={[
                                {
                                    id: "topic",
                                    header: "Topic",
                                    cell: (m) => {
                                        return m.topic;
                                    },
                                    sortingField: "topic",
                                    width: "20%"
                                },
                                {
                                    id: "message",
                                    header: "Message",
                                    cell: (m) => {
                                        return <pre>{m.binaryPayload}</pre>
                                    },
                                    width: "60%"
                                },
                                {
                                    id: "date",
                                    header: "Receive time",
                                    cell: (m: Message) => {
                                        return m.received.toLocaleTimeString();
                                    },
                                    sortingField: "received",
                                    width: "20%"
                                }
                            ]}
                            items={items}
                            visibleColumns={preferences.visibleContent}
                            preferences={
                                <CollectionPreferences
                                    visibleContentPreference={{
                                        title: "Visible columns",
                                        options: [{
                                            label: "", options: [
                                                {editable: true, label: "Topic", id: "topic"},
                                                {editable: true, label: "Message", id: "message"},
                                                {editable: true, label: "Receive time", id: "date"},
                                            ]
                                        }]
                                    }}
                                    pageSizePreference={{
                                        title: "Page size",
                                        options: [
                                            {value: 50, label: "50"},
                                            {value: 100, label: "100"},
                                            {value: 1000, label: "1000"}]
                                    }}
                                    title={"Preferences"}
                                    confirmLabel={"Ok"}
                                    cancelLabel={"Cancel"}
                                    preferences={preferences}
                                    onConfirm={({detail}) => setPreferences(detail)}
                                />
                            }
                            pagination={<Pagination {...paginationProps} />}
                            empty={
                                <Box textAlign="center" color="inherit">
                                    <b>No messages</b>
                                </Box>
                            }
                        />
                    </Grid>
                </Container>
            </SpaceBetween>
        </ContentLayout>
    );
};

export default withRouter(PubSub);
