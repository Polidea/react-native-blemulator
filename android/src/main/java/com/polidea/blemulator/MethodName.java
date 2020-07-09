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

    String DISCOVERY = "discovery";
}
