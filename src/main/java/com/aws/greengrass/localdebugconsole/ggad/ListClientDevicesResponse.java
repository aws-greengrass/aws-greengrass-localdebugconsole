/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.aws.greengrass.localdebugconsole.ggad;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class ListClientDevicesResponse {
    public boolean successful;
    public String errorMsg;
    public List<ClientDevice> clientDevices = Collections.emptyList();
}
