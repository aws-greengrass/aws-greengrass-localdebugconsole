/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {ErrorInfo, Suspense, useEffect, useState} from "react";
import {SERVER} from "../index";
import {APICall} from "../util/CommUtils";

export default function (props: { pageType: string, componentName?: string }) {
    const [extensions, setExtensions] = useState(new Set());
    useEffect(() => {
        (async () => {
            const newExtensions: Array<any> = await SERVER.sendRequest({
                call: APICall.getExtensions,
                args: [props.pageType, props.componentName]
            });
            newExtensions.map(v => v.extensionPath).forEach(extensions.add, extensions)
            setExtensions(new Set(extensions));
        })();
        // eslint-disable-next-line
    }, [props]);

    return <>{Array.from(extensions).map((v: any, i: number) => {
        const ExtensionComp = React.lazy(() => import(/* webpackIgnore: true */ "/" + v));
        return (<div key={"extension " + i} className="col-12 col-l-6 col-xl-6">
            <ErrorBoundary>
                <Suspense fallback={<div>Loading extension from {v}...</div>}>
                    <ExtensionComp {...props} server={SERVER}/>
                </Suspense>
            </ErrorBoundary>
        </div>);
    })}</>
}

class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI.
        return {hasError: true};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
    }
}
