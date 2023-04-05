/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import "./index.css";
import React, {ReactNode, Suspense, useState} from "react";
import ReactDOM from "react-dom";

import { HashRouter, Route, Switch, Redirect } from "react-router-dom";
import { routes } from "./navigation/constRoutes";
import NavSideBar from "./navigation/NavSideBar";

import "@cloudscape-design/global-styles/index.css"
import {AppLayout, Box, Flashbar, FlashbarProps, Spinner} from "@cloudscape-design/components";
import ServerEndpoint from "./communication/ServerEndpoint";
import Breadcrumbs from "./navigation/Breadcrumbs";
import { SERVICE_ROUTE_HREF_PREFIX } from "./util/constNames";
import {ErrorBoundary} from "react-error-boundary";
import createPersistedState from 'use-persisted-state';
import generateUniqueId from "./util/generateUniqueId";


export var SERVER: ServerEndpoint;
const apiResource = (websocketError: (m: ReactNode) => void) => {
    if (!SERVER) {
        // @ts-ignore
        SERVER = new ServerEndpoint(window.WEBSOCKET_PORT, window.USERNAME, window.PASSWORD, 5, websocketError);
    }

    let status = 0;
    let e: any;
    const prom = SERVER.initConnections()
        .then(() => {
            status = 1;
        })
        .catch((ex) => {
            status = 2;
            e = ex;
        });

    return {
        read() {
            switch (status) {
                case 0:
                    throw prom;
                case 1:
                    return null;
                case 2:
                    throw e;
            }
        }
    };
}

const Routes = ({apiResource}: {apiResource: any}) => {
    apiResource.read();
    return (<Switch>
        <Redirect
            exact
            from={SERVICE_ROUTE_HREF_PREFIX.slice(1, -1)}
            to="/"
        />
        {routes.map((route: any, index: any) => (
            <Route
                exact
                key={index}
                path={route.routePath}
                children={<route.main/>}
            />
        ))}
    </Switch>);
}

const useNavOpenState = createPersistedState<boolean>("gg.navOpen");

const AppFunc = () => {
    const [flashItems, setFlashItems] = useState([] as FlashbarProps.MessageDefinition[]);
    const [navigationOpen, setNavigationOpen] = useNavOpenState(true);

    const addFlashbarItem = (item: FlashbarProps.MessageDefinition) => {
        item.dismissible = true;
        item.onDismiss = () => {
            setFlashItems((flashItems) => flashItems.filter(i => i.id !== item.id));
        };
        item.id = generateUniqueId();
        setFlashItems((flashItems) => [...flashItems, item]);
    }

    const websocketError = (m: ReactNode) => {
        addFlashbarItem({
            type: 'error',
            header: 'Error connecting to WebSocket',
            content: m,
        })
    }

    const resource = apiResource(websocketError);

    return (
        <HashRouter>
            <AppLayout
                navigation={<NavSideBar />}
                breadcrumbs={<Breadcrumbs />}
                notifications={<Flashbar items={flashItems} />}
                navigationOpen={navigationOpen}
                onNavigationChange={(e) => setNavigationOpen(e.detail.open)}
                toolsHide={true}
                contentType="default"
                content={
                <ErrorBoundary fallback={
                    <Box textAlign={"center"} padding={{top: "xxxl"}} variant={"h2"}>
                        Unable to connect to Greengrass
                    </Box>
                }>
                    <Suspense fallback={
                        <Box textAlign={"center"} padding={{top: "xxxl"}} variant={"h1"}>
                            Loading... <Spinner size={"big"}/>
                        </Box>
                    }>
                        <Routes apiResource={resource}/>
                    </Suspense>
                </ErrorBoundary>
                }
            />
        </HashRouter>
    );
}

ReactDOM.render(<AppFunc />,
  document.getElementById("app")
);
