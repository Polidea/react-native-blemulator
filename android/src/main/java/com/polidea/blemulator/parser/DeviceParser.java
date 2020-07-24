package com.polidea.blemulator.parser;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.polidea.blemulator.NativeArgumentName;
import com.polidea.multiplatformbleadapter.Device;

import java.util.ArrayList;

public class DeviceParser {
    public Device parseDevice(ReadableMap serializedDevice) {
        String id = serializedDevice.getString(NativeArgumentName.ID);
        String name = serializedDevice.getString(NativeArgumentName.NAME);
        Device result = new Device(id, name);
        if (serializedDevice.hasKey(NativeArgumentName.RSSI)) {
            int rssi = serializedDevice.getInt(NativeArgumentName.RSSI);
            result.setRssi(rssi);
        }

        return result;
    }

    public Device[] parseDevices(ReadableArray serializedDevicesArray) {
        ArrayList<Device> result = new ArrayList<>();

        for (int i = 0; i < serializedDevicesArray.size(); i++) {
            result.add(parseDevice(serializedDevicesArray.getMap(i)));
        }

        return result.toArray(new Device[0]);
    }
}
