package com.polidea.blemulator.containers;

import com.polidea.multiplatformbleadapter.ConnectionState;
import com.polidea.multiplatformbleadapter.Device;

import java.util.HashMap;
import java.util.Map;

public class DeviceManager {
    private Map<String, DeviceContainer> deviceContainers = new HashMap<>();

    public void updateConnectionStateForDevice(String deviceId, ConnectionState state) {
        switch (state) {
            case CONNECTED:
                deviceContainers.get(deviceId).onConnectionEstablished();
                break;
            case DISCONNECTED:
                deviceContainers.get(deviceId).clear();
        }
    }

    public void addDeviceIfUnknown(String deviceId, String name) {
        if (!deviceContainers.containsKey(deviceId)) {
            deviceContainers.put(deviceId, new DeviceContainer(new Device(deviceId, name)));
        }
    }

    public DeviceContainer getDeviceContainerForGattId(int id) {
        for (DeviceContainer deviceContainer : deviceContainers.values()) {
            if (deviceContainer.hasId(id)) {
                return deviceContainer;
            }
        }
        return null;
    }

    public DeviceContainer getDeviceContainer(String deviceId) {
        return deviceContainers.get(deviceId);
    }
}
