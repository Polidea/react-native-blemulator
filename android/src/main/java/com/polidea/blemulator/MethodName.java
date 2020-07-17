package com.polidea.blemulator;

public interface MethodName {
    String CREATE_CLIENT = "createClient";
    String DESTROY_CLIENT = "destroyClient";

    String ENABLE = "enable";
    String DISABLE = "disable";

    String START_SCAN = "startScan";
    String STOP_SCAN = "stopScan";

    String CONNECT = "connect";
    String CANCEL_CONNECTION_OR_DISCONNECT = "disconnect";
    String IS_DEVICE_CONNECTED = "isDeviceConnected";

    String REQUEST_MTU = "requestMtu";

    String DISCOVERY = "discovery";

    String READ_CHARACTERISTIC = "readCharacteristic";
    String READ_CHARACTERISTIC_FOR_SERVICE = "readCharacteristicForService";
    String READ_CHARACTERISTIC_FOR_DEVICE = "readCharacteristicForDevice";

    String WRITE_CHARACTERISTIC = "writeCharacteristic";
    String WRITE_CHARACTERISTIC_FOR_SERVICE = "writeCharacteristicForService";
    String WRITE_CHARACTERISTIC_FOR_DEVICE = "writeCharacteristicForDevice";

    String MONITOR_CHARACTERISTIC = "monitorCharacteristic";
    String MONITOR_CHARACTERISTIC_FOR_SERVICE = "monitorCharacteristicForService";
    String MONITOR_CHARACTERISTIC_FOR_DEVICE = "monitorCharacteristicForDevice";
}
