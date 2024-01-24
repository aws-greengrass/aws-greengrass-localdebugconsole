/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.aws.greengrass.localdebugconsole.ggad;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ClientDevice {
    String thingName;
}
