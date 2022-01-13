/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export default function (props: any) {
    console.log(props);
    const x = async () => {
        console.log(await props.server.sendRequest({
            call: "pluginCall",
            args: ["testPlugin", "fromFrontEnd"],
        }));
    };
    x();
    return (<>
        <h1>I'm a plugin!</h1>
    </>)
}
