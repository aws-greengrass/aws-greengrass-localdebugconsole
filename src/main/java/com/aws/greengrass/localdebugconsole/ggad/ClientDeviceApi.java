/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.aws.greengrass.localdebugconsole.ggad;

import java.util.List;

public interface ClientDeviceApi {

    List<ClientDevice> listClientDevices();

}
