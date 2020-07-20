package com.polidea.blemulator.parser;

import com.facebook.react.bridge.ReadableMap;
import com.polidea.blemulator.NativeArgumentName;
import com.polidea.multiplatformbleadapter.Device;

public class DeviceParser {
    public Device parseDevice(ReadableMap serializedDevice) {
        String id = serializedDevice.getString(NativeArgumentName.ID);
        String name = serializedDevice.getString(NativeArgumentName.NAME);

        return new Device(id, name);
    }
}
