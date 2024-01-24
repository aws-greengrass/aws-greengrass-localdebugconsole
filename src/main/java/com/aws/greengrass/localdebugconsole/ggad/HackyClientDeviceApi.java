/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.aws.greengrass.localdebugconsole.ggad;

import java.util.Collections;
import java.util.List;

public class HackyClientDeviceApi implements ClientDeviceApi {
    @Override
    public List<ClientDevice> listClientDevices() {
        return Collections.singletonList(ClientDevice.builder().thingName("test").build());
    }
}
