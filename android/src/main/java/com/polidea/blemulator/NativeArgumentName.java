package com.polidea.blemulator;

public interface NativeArgumentName {
    //UNIVERSAL
    String ERROR = "error";
    String ERROR_CODE = "errorCode";
    String ERROR_MESSAGE = "message";
    String ID = "id";
    String VALUE = "value";

    //ScanResult
    String NAME = "name";
    String RSSI ="rssi";
    String TX_POWER_LEVEL = "txPowerLeveL";
    String OVERFLOW_SERVICE_UUIDS = "overflowServiceUuids";
    String SERVICE_DATA = "serviceData";
    String SERVICE_UUIDS = "serviceUuids";
    String SOLICITED_SERVICE_UUIDS = "solicitedServiceUuids";
    String MANUFACTURER_DATA = "manufacturerData";
    String LOCAL_NAME = "localName";

    //Discovery
    String DEVICE_ID = "peripheralId";
    String UUID = "uuid";
    String CHARACTERISTICS = "characteristics";
    String SERVICE_ID = "serviceId";
    String SERVICE_UUID = "serviceUuid";
    String IS_READABLE = "isReadable";
    String IS_WRITABLE_WITHOUT_RESPONSE = "isWritableWithoutResponse";
    String IS_WRITABLE_WITH_RESPONSE = "isWritableWithResponse";
    String IS_NOTIFIABLE = "isNotifiable";
    String IS_INDICATABLE = "isIndicatable";
    String IS_NOTIFYING = "isNotifying";
    String DESCRIPTORS = "descriptors";
    String CHARACTERISTIC_ID = "characteristicId";
    String CHARACTERISTIC_UUID = "characteristicUuid";
}
