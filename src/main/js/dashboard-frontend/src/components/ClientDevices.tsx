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
    public hasSession?: boolean;
    public certExpiry?: number;

    constructor(thingName: string, hasSession?: boolean, certExpiry?: number) {
        this.thingName = thingName;
        this.hasSession = hasSession;
        this.certExpiry = certExpiry;
    }
}

class ServiceStatus {
    public online: boolean;
    public brokerAddress?: string;

    constructor(online: boolean, brokerAddress?: string) {
        this.online = online;
        this.brokerAddress = brokerAddress;
    }
}

const ClientDevices = () => {

    // model state
    const [clientDevices, setClientDevices] = useState<ClientDevice[]>([])
    const [serviceStatus, setServiceStatus] = useState<ServiceStatus>();

    // page state
    const [selectedClientDevices, setSelectedClientDevices] = useState<ClientDevice[]>()
    const [currentPageIndex, setCurrentPageIndex] = useState(1);
    const [filteringText, setFilteringText] = useState("");

    // api operations
    const listClientDevices = () =>
        SERVER.sendRequest({call: APICall.listClientDevices, args: []})
            .then(resp => setClientDevices(resp.clientDevices))
            .catch(reason => console.log("Error: " + reason));
    const fetchServiceStatus = () =>
        SERVER.sendRequest({call: APICall.cdaGetServiceStatus, args: []})
            .then(resp => {
                if (resp) {
                    setServiceStatus(resp)
                }
            })
            .catch(reason => console.log("Error: " + reason));

    const refreshAll = () => {
        void fetchServiceStatus();
        void listClientDevices();
    };

    // event handling
    const onClickRefresh = refreshAll;
    const onPageIndexChanged = listClientDevices;

    const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
        pageSize: 100,
        visibleContent: ["thingName", "hasSession", "certExpiry"]
    });

    useEffect(refreshAll, [currentPageIndex, preferences]);

    const cols: TableProps.ColumnDefinition<ClientDevice>[] = [
        {
            id: "thingName",
            header: "Thing Name",
            cell: (e: ClientDevice) => e.thingName
        },
        {
            id: "hasSession",
            header: "Connected",
            cell: (e: ClientDevice) => {
                if (e.hasSession === undefined) {
                    return "Unknown";
                }
                return e.hasSession ? "Yes" : "No";
            }
        },
        {
            id: "certExpiry",
            header: "Certificate Expiry",
            cell: (e: ClientDevice) => {
                if (e.certExpiry === undefined) {
                    return "Unknown";
                }
                return new Date(e.certExpiry).toString();
            }
        }
    ];

    // TODO make pretty
    const serviceStatusPage = (
        <div>
            <Button
                onClick={onClickRefresh}
                iconName="refresh"
                wrapText={false}
                disabled={false}
            >
            </Button>
            <p>Client Device Auth Component</p>
            <ul>
                <li>Network connected?: {serviceStatus?.online ? "Yes" : "No"}</li>
                <li>MQTT Broker Address: {serviceStatus?.brokerAddress}</li>
            </ul>
        </div>
    );

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
                            {editable: true, label: "Connected", id: "hasSession"},
                            {editable: true, label: "Certificate Expiry", id: "certExpiry"},
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
            label: "Service Status",
            content: serviceStatusPage,
        },
        {
            id: "tab2",
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
