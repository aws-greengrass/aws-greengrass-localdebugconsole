/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {
    Box,
    Button,
    CollectionPreferences,
    CollectionPreferencesProps,
    Container,
    ContentLayout,
    Header,
    SpaceBetween,
    Table,
    TableProps,
    Tabs,
    TabsProps, TextFilter,
} from "@cloudscape-design/components";

import {APICall} from "../util/CommUtils";

import {SERVER} from "../index";
import PaginationRendering from "../util/PaginationRendering";


class ClientDevice {
    public thingName: string;

    constructor(thingName: string) {
        this.thingName = thingName;
    }
}

class ListClientDevicesResponse {
    public successful: boolean;
    public errorMsg: string | null;
    public clientDevices: ClientDevice[];

    constructor() {
        this.successful = false;
        this.errorMsg = null;
        this.clientDevices = [];
    }
}

const ClientDevices = () => {

    // model state
    const [clientDevices, setClientDevices] = useState<ClientDevice[]>([])

    // page state
    const [selectedClientDevices, setSelectedClientDevices] = useState<ClientDevice[]>()
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [filteringText, setFilteringText] = useState("");

    // api operations
    const listClientDevices = () =>
        SERVER.sendRequest({call: APICall.listClientDevices, args: []})
            .then(resp => setClientDevices(resp.clientDevices))
            .catch(reason => console.log("Error: " + reason));

    // event handling
    const onClickRefresh = listClientDevices;
    const onPageIndexChanged = listClientDevices;

    const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
        pageSize: 100,
        visibleContent: ["thingName"]
    });

    useEffect(() => {
        void listClientDevices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPageIndex, preferences]);


    const cols: TableProps.ColumnDefinition<ClientDevice>[] = [
        {
            id: "thingName",
            header: "Thing Name",
            cell: (e: ClientDevice) => e.thingName
        }
    ];

    const clientDevicesTable = (<Table
        empty={
            <Box textAlign="center" color="inherit">
                <b>No client devices</b>
                <Box
                    padding={{bottom: "s"}}
                    variant="p"
                    color="inherit"
                >
                    No client devices to display.
                </Box>
            </Box>
        }
        filter={
            <TextFilter
                filteringPlaceholder="Find client device"
                filteringText={filteringText}
                onChange={({detail}) => setFilteringText(detail.filteringText)}
            />
        }
        selectionType="single"
        trackBy="key"
        selectedItems={selectedClientDevices}
        loadingText="Loading client devices"
        items={clientDevices.slice((currentPageIndex - 1) * (preferences.pageSize || 10), (currentPageIndex - 1) * (preferences.pageSize || 10) + (preferences.pageSize || 10)).filter((d: ClientDevice) => d.thingName.toLowerCase().includes(filteringText.toLowerCase()))}
        onSelectionChange={(e: any) => {
            setSelectedClientDevices(clientDevices.filter((d: ClientDevice) => d.thingName === e.detail.selectedItems[0].thingName))
        }}
        columnDefinitions={cols}
        visibleColumns={preferences.visibleContent}
        preferences={
            <CollectionPreferences
                visibleContentPreference={{
                    title: "Visible columns",
                    options: [{
                        label: "", options: [
                            {editable: false, label: "Thing Name", id: "thingName"},
                        ]
                    }]
                }}
                pageSizePreference={{
                    title: "Page size",
                    options: [
                        {value: 5, label: "5"},
                        {value: 10, label: "10"},
                        {value: 50, label: "50"}]
                }}
                title={"Preferences"}
                confirmLabel={"Ok"}
                cancelLabel={"Cancel"}
                preferences={preferences}
                onConfirm={({detail}) => {
                    setPreferences(detail);
                }}
            />
        }
        header={
            <Header
                counter={`(${clientDevices.length})`}
                actions={
                    <SpaceBetween direction="horizontal" size="xs">
                        <Button
                            onClick={onClickRefresh}
                            iconName="refresh"
                            wrapText={false}
                            disabled={false}
                        >
                        </Button>
                    </SpaceBetween>
                }
            >
                Client Devices
            </Header>
        }
        pagination={
            <PaginationRendering
                numberOfItems={clientDevices.length}
                numberOfItemPerPage={preferences.pageSize || 1}
                pageIndex={currentPageIndex}
                onPageIndexChanged={(pageIndex: any) => {
                    setCurrentPageIndex(pageIndex);
                    onPageIndexChanged();
                }}
            />
        }
        variant="borderless"
    />);

    const tabs: TabsProps.Tab[] = [
        {
            id: "tab1",
            label: "Client Devices",
            content: clientDevicesTable,
        },
    ];

    return (
        <ContentLayout header={<Header variant={"h1"}>Client Devices</Header>}>
            <Container>
                <Tabs tabs={tabs}></Tabs>
            </Container>
        </ContentLayout>
    );
};

export default withRouter(ClientDevices);
