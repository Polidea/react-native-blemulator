package com.polidea.blemulator;

import android.util.Log;

import com.polidea.multiplatformbleadapter.BleAdapter;
import com.polidea.multiplatformbleadapter.Characteristic;
import com.polidea.multiplatformbleadapter.ConnectionOptions;
import com.polidea.multiplatformbleadapter.ConnectionState;
import com.polidea.multiplatformbleadapter.Descriptor;
import com.polidea.multiplatformbleadapter.Device;
import com.polidea.multiplatformbleadapter.OnErrorCallback;
import com.polidea.multiplatformbleadapter.OnEventCallback;
import com.polidea.multiplatformbleadapter.OnSuccessCallback;
import com.polidea.multiplatformbleadapter.ScanResult;
import com.polidea.multiplatformbleadapter.Service;
import com.polidea.multiplatformbleadapter.errors.BleError;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SimulatedAdapter implements BleAdapter {

    private static final String TAG =  SimulatedAdapter.class.getName();
    private final BlemulatorModule module;
    private final PlatformToJsBridge bridge;

    private OnEventCallback<ScanResult> scanResultCallback = null;
    private Map<String, Device> peripherals = new HashMap<>();
    private Map<String, OnEventCallback<ConnectionState>> connectionStateCallbacks = new HashMap<>();

    public SimulatedAdapter(BlemulatorModule module, PlatformToJsBridge bridge) {
        this.module = module;
        this.bridge = bridge;
    }

    public void addScanResult(ScanResult scanResult) {
        if (scanResultCallback != null) {
            scanResultCallback.onEvent(scanResult);
        }
        if (!peripherals.containsKey(scanResult.getDeviceId())) {
            peripherals.put(scanResult.getDeviceId(), new Device(scanResult.getDeviceId(), scanResult.getDeviceName()));
        }
    }

    @Override
    public void createClient(String restoreStateIdentifier, OnEventCallback<String> onAdapterStateChangeCallback, OnEventCallback<Integer> onStateRestored) {
        Log.i(TAG, "createClient called");
        module.registerAdapter(this);
    }

    @Override
    public void destroyClient() {
        Log.i(TAG, "destroyClient called");
        module.deregisterAdapter();
    }

    @Override
    public void enable(String transactionId, OnSuccessCallback<Void> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "enable called");
    }

    @Override
    public void disable(String transactionId, OnSuccessCallback<Void> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "disable called");
    }

    @Override
    public String getCurrentState() {
        Log.i(TAG, "getCurrentState called");
        return null;
    }

    @Override
    public void startDeviceScan(String[] filteredUUIDs, int scanMode, int callbackType, OnEventCallback<ScanResult> onEventCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "startDeviceScan called");
        if (scanResultCallback == null) {
            bridge.startScan(filteredUUIDs, scanMode, callbackType, onErrorCallback);
            scanResultCallback = onEventCallback;
        } else {
            throw new IllegalStateException("Scan already in progress");
        }
    }

    @Override
    public void stopDeviceScan() {
        Log.i(TAG, "stopDeviceScan called");
        bridge.stopScan();
        scanResultCallback = null;
    }

    @Override
    public void requestConnectionPriorityForDevice(String deviceIdentifier, int connectionPriority, String transactionId, OnSuccessCallback<Device> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "requestConnectionPriorityForDevice called");
    }

    @Override
    public void readRSSIForDevice(String deviceIdentifier, String transactionId, OnSuccessCallback<Device> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readRSSIForDevice called");
    }

    @Override
    public void requestMTUForDevice(String deviceIdentifier, int mtu, String transactionId, OnSuccessCallback<Device> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "requestMTUForDevice called");
    }

    @Override
    public void getKnownDevices(String[] deviceIdentifiers, OnSuccessCallback<Device[]> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "getKnownDevices called");
    }

    @Override
    public void getConnectedDevices(String[] serviceUUIDs, OnSuccessCallback<Device[]> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "getConnectedDevices called");
    }

    @Override
    public void connectToDevice(final String deviceIdentifier,
                                ConnectionOptions connectionOptions,
                                final OnSuccessCallback<Device> onSuccessCallback,
                                OnEventCallback<ConnectionState> onConnectionStateChangedCallback,
                                OnErrorCallback onErrorCallback) {
        Log.i(TAG, "connectToDevice called");
        connectionStateCallbacks.put(deviceIdentifier, onConnectionStateChangedCallback); //TODO #16 remove listener when device is disconnected
        OnSuccessCallback<Device> modifiedOnSuccessCallback = new OnSuccessCallback<Device>() {
            @Override
            public void onSuccess(Device data) {
                onSuccessCallback.onSuccess(peripherals.get(deviceIdentifier));
            }
        };
        bridge.connect(deviceIdentifier, connectionOptions, modifiedOnSuccessCallback, onErrorCallback);
    }

    @Override
    public void cancelDeviceConnection(final String deviceIdentifier,
                                       final OnSuccessCallback<Device> onSuccessCallback,
                                       OnErrorCallback onErrorCallback) {
        Log.i(TAG, "cancelDeviceConnection called");
        OnSuccessCallback<Device> modifiedOnSuccessCallback = new OnSuccessCallback<Device>() {
            @Override
            public void onSuccess(Device data) {
                onSuccessCallback.onSuccess(peripherals.get(deviceIdentifier));
            }
        };
        bridge.cancelDeviceConnection(deviceIdentifier, modifiedOnSuccessCallback, onErrorCallback);
    }

    @Override
    public void isDeviceConnected(String deviceIdentifier, OnSuccessCallback<Boolean> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "isDeviceConnected called");
    }

    @Override
    public void discoverAllServicesAndCharacteristicsForDevice(String deviceIdentifier, String transactionId, OnSuccessCallback<Device> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "discoverAllServicesAndCharacteristicsForDevice called");
    }

    @Override
    public List<Service> getServicesForDevice(String deviceIdentifier) throws BleError {
        Log.i(TAG, "getServicesForDevice called");
        return null;
    }

    @Override
    public List<Characteristic> getCharacteristicsForDevice(String deviceIdentifier, String serviceUUID) throws BleError {
        Log.i(TAG, "getCharacteristicsForDevice called");
        return null;
    }

    @Override
    public List<Characteristic> getCharacteristicsForService(int serviceIdentifier) throws BleError {
        Log.i(TAG, "getCharacteristicsForService called");
        return null;
    }

    @Override
    public List<Descriptor> descriptorsForDevice(String deviceIdentifier, String serviceUUID, String characteristicUUID) throws BleError {
        Log.i(TAG, "descriptorsForDevice called");
        return null;
    }

    @Override
    public List<Descriptor> descriptorsForService(int serviceIdentifier, String characteristicUUID) throws BleError {
        Log.i(TAG, "descriptorsForService called");
        return null;
    }

    @Override
    public List<Descriptor> descriptorsForCharacteristic(int characteristicIdentifier) throws BleError {
        Log.i(TAG, "descriptorsForCharacteristic called");
        return null;
    }

    @Override
    public void readCharacteristicForDevice(String deviceIdentifier, String serviceUUID, String characteristicUUID, String transactionId, OnSuccessCallback<Characteristic> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readCharacteristicForDevice called");
    }

    @Override
    public void readCharacteristicForService(int serviceIdentifier, String characteristicUUID, String transactionId, OnSuccessCallback<Characteristic> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readCharacteristicForService called");
    }

    @Override
    public void readCharacteristic(int characteristicIdentifer, String transactionId, OnSuccessCallback<Characteristic> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readCharacteristic called");
    }

    @Override
    public void writeCharacteristicForDevice(String deviceIdentifier, String serviceUUID, String characteristicUUID, String valueBase64, boolean withResponse, String transactionId, OnSuccessCallback<Characteristic> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "writeCharacteristicForDevice called");
    }

    @Override
    public void writeCharacteristicForService(int serviceIdentifier, String characteristicUUID, String valueBase64, boolean withResponse, String transactionId, OnSuccessCallback<Characteristic> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "writeCharacteristicForService called");
    }

    @Override
    public void writeCharacteristic(int characteristicIdentifier, String valueBase64, boolean withResponse, String transactionId, OnSuccessCallback<Characteristic> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "writeCharacteristic called");
    }

    @Override
    public void monitorCharacteristicForDevice(String deviceIdentifier, String serviceUUID, String characteristicUUID, String transactionId, OnEventCallback<Characteristic> onEventCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "monitorCharacteristicForDevice called");
    }

    @Override
    public void monitorCharacteristicForService(int serviceIdentifier, String characteristicUUID, String transactionId, OnEventCallback<Characteristic> onEventCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "monitorCharacteristicForService called");
    }

    @Override
    public void monitorCharacteristic(int characteristicIdentifier, String transactionId, OnEventCallback<Characteristic> onEventCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "monitorCharacteristic called");
    }

    @Override
    public void readDescriptorForDevice(String deviceId, String serviceUUID, String characteristicUUID, String descriptorUUID, String transactionId, OnSuccessCallback<Descriptor> successCallback, OnErrorCallback errorCallback) {
        Log.i(TAG, "readDescriptorForDevice called");
    }

    @Override
    public void readDescriptorForService(int serviceIdentifier, String characteristicUUID, String descriptorUUID, String transactionId, OnSuccessCallback<Descriptor> successCallback, OnErrorCallback errorCallback) {
        Log.i(TAG, "readDescriptorForService called");
    }

    @Override
    public void readDescriptorForCharacteristic(int characteristicIdentifier, String descriptorUUID, String transactionId, OnSuccessCallback<Descriptor> successCallback, OnErrorCallback errorCallback) {
        Log.i(TAG, "readDescriptorForCharacteristic called");
    }

    @Override
    public void readDescriptor(int descriptorIdentifier, String transactionId, OnSuccessCallback<Descriptor> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readDescriptor called");
    }

    @Override
    public void writeDescriptorForDevice(String deviceId, String serviceUUID, String characteristicUUID, String descriptorUUID, String valueBase64, String transactionId, OnSuccessCallback<Descriptor> successCallback, OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptorForDevice called");
    }

    @Override
    public void writeDescriptorForService(int serviceIdentifier, String characteristicUUID, String descriptorUUID, String valueBase64, String transactionId, OnSuccessCallback<Descriptor> successCallback, OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptorForService called");
    }

    @Override
    public void writeDescriptorForCharacteristic(int characteristicIdentifier, String descriptorUUID, String valueBase64, String transactionId, OnSuccessCallback<Descriptor> successCallback, OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptorForCharacteristic called");
    }

    @Override
    public void writeDescriptor(int descriptorIdentifier, String valueBase64, String transactionId, OnSuccessCallback<Descriptor> successCallback, OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptor called");
    }

    @Override
    public void cancelTransaction(String transactionId) {
        Log.i(TAG, "cancelTransaction called");
    }

    @Override
    public void setLogLevel(String logLevel) {
        Log.i(TAG, "setLogLevel called");
    }

    @Override
    public String getLogLevel() {
        Log.i(TAG, "getLogLevel called");
        return null;
    }
}
