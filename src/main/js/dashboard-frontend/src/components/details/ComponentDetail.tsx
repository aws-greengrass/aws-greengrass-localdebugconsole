/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {ErrorInfo, Suspense, useEffect, useState} from "react";
import {ConfigEditor} from "./ConfigEditor";
import DependencyGraph from "./DependencyGraph";
import {useHistory, withRouter} from "react-router-dom";
import {SERVICE_ROUTE_HREF_PREFIX} from "../../util/constNames";
import DetailHeader from "./DetailHeader";
import DetailBody from "./DetailBody";
import {SERVER} from "../../index";
import {APICall} from "../../util/CommUtils";

function ComponentDetail() {
  let service = useHistory().location.pathname.substring(
    SERVICE_ROUTE_HREF_PREFIX.length - 1
  );
  const [extensions, setExtensions] = useState(new Set());
  useEffect(() => {
    (async () => {
      const newExtensions: Array<any> = await SERVER.sendRequest({call: APICall.getExtensions, args: ["ComponentDetails", service]});
      newExtensions.map(v => v.extensionPath).forEach(extensions.add, extensions)
      setExtensions(new Set(extensions));
    })();
  // eslint-disable-next-line
  }, [service]);

  return (
    <>
      <DetailHeader service={service} />
      <div className="awsui-grid">
        <div className="awsui-row">
          <div className="col-12 col-l-12 col-xl-12">
            <DetailBody service={service} />
          </div>
          <div className="col-12 col-l-6 col-xl-6">
            <ConfigEditor dark={false} service={service} />
          </div>
          <div className="col-12 col-l-6 col-xl-6">
            <DependencyGraph rootComponent={service}/>
          </div>
          {Array.from(extensions).map((v: any, i: number) => {
                const ExtensionComp = React.lazy(() => import(/* webpackIgnore: true */ "/" + v));
                return (<div key={"extension " + i} className="col-12 col-l-6 col-xl-6">
                  <ErrorBoundary>
                    <Suspense fallback={<div>Loading extension from {v}...</div>}>
                      <ExtensionComp componentName={service} server={SERVER}/>
                    </Suspense>
                  </ErrorBoundary>
                </div>);
              }
          )}
        </div>
      </div>
    </>
  );
}

class ErrorBoundary extends React.Component<{}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
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

export default withRouter(ComponentDetail);
