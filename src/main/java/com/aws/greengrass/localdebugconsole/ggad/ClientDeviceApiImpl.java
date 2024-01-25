/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.aws.greengrass.localdebugconsole.ggad;

import com.aws.greengrass.clientdevices.auth.api.ClientDevicesAuthServiceApi;
import com.aws.greengrass.lifecyclemanager.Kernel;
import com.aws.greengrass.lifecyclemanager.exceptions.ServiceLoadException;
import lombok.RequiredArgsConstructor;

import javax.inject.Singleton;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Singleton
@RequiredArgsConstructor
public class ClientDeviceApiImpl implements ClientDeviceApi {

    private final Kernel kernel;

    @Override
    public List<ClientDevice> listClientDevices() {
        try {
            return cda().listClientDevices().stream()
                    .map(d -> ClientDevice.builder()
                            .thingName(d.getThingName())
                            .hasSession(d.getHasSession())
                            .certExpiry(d.getCertExpiry() == null ? null : d.getCertExpiry().getTime())
                            .build())
                    .collect(Collectors.toList());
        } catch (ServiceLoadException e) {
            return Collections.emptyList();
        }
    }

    @Override
    public ServiceStatus getServiceStatus() {
        try {
            com.aws.greengrass.clientdevices.auth.api.ServiceStatus status = cda().getServiceStatus();
            return ServiceStatus.builder()
                    .brokerAddress(status.getBrokerAddress())
                    .online(status.getOnline())
                    .build();
        } catch (ServiceLoadException e) {
            return null;
        }
    }

    private synchronized ClientDevicesAuthServiceApi cda() throws ServiceLoadException {
        return kernel.locate("aws.greengrass.clientdevices.Auth")
                    .getContext().get(ClientDevicesAuthServiceApi.class);
    }
}
