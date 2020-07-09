package com.polidea.blemulator;

import android.util.Log;

import com.polidea.blemulator.containers.CachedCharacteristic;
import com.polidea.blemulator.containers.CachedService;
import com.polidea.blemulator.containers.DeviceContainer;
import com.polidea.blemulator.containers.DeviceManager;
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
import com.polidea.multiplatformbleadapter.errors.BleErrorCode;
import com.polidea.multiplatformbleadapter.utils.Constants;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SimulatedAdapter implements BleAdapter {

    private static final String TAG =  SimulatedAdapter.class.getName();
    private final BlemulatorModule module;
    private final PlatformToJsBridge bridge;

    private @Constants.BluetoothState String adapterState = Constants.BluetoothState.UNKNOWN;
    private OnEventCallback<String> onAdapterStateChangeCallback = null;
    private OnEventCallback<ScanResult> scanResultCallback = null;
    private DeviceManager deviceManager = new DeviceManager();
    private Map<String, OnEventCallback<ConnectionState>> connectionStateCallbacks = new HashMap<>();

    public SimulatedAdapter(BlemulatorModule module, PlatformToJsBridge bridge) {
        this.module = module;
        this.bridge = bridge;
    }

    public void addScanResult(ScanResult scanResult) {
        if (scanResultCallback != null) {
            scanResultCallback.onEvent(scanResult);
        }
        deviceManager.addDeviceIfUnknown(scanResult.getDeviceId(), scanResult.getDeviceName());
    }

    public void  publishAdapterState(@Constants.BluetoothState String newState) {
        adapterState = newState;
        if (onAdapterStateChangeCallback != null) {
            onAdapterStateChangeCallback.onEvent(newState);
        }
    }

    public void publishConnectionState(String peripheralId, ConnectionState state) {
        if (connectionStateCallbacks.containsKey(peripheralId)) {
            connectionStateCallbacks.get(peripheralId).onEvent(state);
            deviceManager.updateConnectionStateForDevice(peripheralId, state);
            if (state == ConnectionState.DISCONNECTED) {
                connectionStateCallbacks.remove(peripheralId);
            }
        } else {
            throw new IllegalStateException("No connection state callback for peripheral id:" + peripheralId);
        }
    }

    @Override
    public void createClient(String restoreStateIdentifier, OnEventCallback<String> onAdapterStateChangeCallback, OnEventCallback<Integer> onStateRestored) {
        Log.i(TAG, "createClient called");
        this.onAdapterStateChangeCallback = onAdapterStateChangeCallback;
        module.registerAdapter(this);
        bridge.createClient();
    }

    @Override
    public void destroyClient() {
        Log.i(TAG, "destroyClient called");
        this.onAdapterStateChangeCallback = null;
        bridge.destroyClient();
        module.deregisterAdapter();
    }

    @Override
    public void enable(String transactionId, OnSuccessCallback<Void> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "enable called");
        bridge.enable(transactionId, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void disable(String transactionId, OnSuccessCallback<Void> onSuccessCallback, OnErrorCallback onErrorCallback) {
        Log.i(TAG, "disable called");
        bridge.disable(transactionId, onSuccessCallback, onErrorCallback);
    }

    @Override
    public String getCurrentState() {
        Log.i(TAG, "getCurrentState called");
        return adapterState;
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
        connectionStateCallbacks.put(deviceIdentifier, onConnectionStateChangedCallback);
        OnSuccessCallback<Device> modifiedOnSuccessCallback = new OnSuccessCallback<Device>() {
            @Override
            public void onSuccess(Device data) {
                onSuccessCallback.onSuccess(deviceManager.getDeviceContainer(deviceIdentifier).getDevice());
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
                onSuccessCallback.onSuccess(deviceManager.getDeviceContainer(deviceIdentifier).getDevice());
            }
        };
        bridge.cancelDeviceConnection(deviceIdentifier, modifiedOnSuccessCallback, onErrorCallback);
    }

    @Override
    public void isDeviceConnected(String deviceIdentifier,
                                  OnSuccessCallback<Boolean> onSuccessCallback,
                                  OnErrorCallback onErrorCallback) {
        Log.i(TAG, "isDeviceConnected called");
        bridge.isDeviceConnected(deviceIdentifier, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void discoverAllServicesAndCharacteristicsForDevice(final String deviceIdentifier,
                                                               String transactionId,
                                                               final OnSuccessCallback<Device> onSuccessCallback,
                                                               OnErrorCallback onErrorCallback) {
        Log.i(TAG, "discoverAllServicesAndCharacteristicsForDevice called");
        OnSuccessCallback<List<CachedService>> modifiedOnSuccess = new OnSuccessCallback<List<CachedService>>() {
            @Override
            public void onSuccess(List<CachedService> data) {
                deviceManager.getDeviceContainer(deviceIdentifier).addGatts(data);
                onSuccessCallback.onSuccess(deviceManager.getDeviceContainer(deviceIdentifier).getDevice());
            }
        };
        bridge.discoverAllGatts(deviceIdentifier, transactionId, modifiedOnSuccess, onErrorCallback);
    }

    @Override
    public List<Service> getServicesForDevice(String deviceIdentifier) throws BleError {
        Log.i(TAG, "getServicesForDevice called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainer(deviceIdentifier);

        if (deviceContainer == null) {
            throw new BleError(BleErrorCode.DeviceNotFound, "Device unknown", 0);
        }

        if (!deviceContainer.isConnected()) {
            throw new BleError(BleErrorCode.DeviceNotConnected, "Device not connected", 0);
        }

        if (deviceContainer.getServices().isEmpty()) {
            throw new BleError(BleErrorCode.ServicesNotDiscovered, "Discovery not done on this device", 0);
        }

        return deviceContainer.getServices();
    }

    @Override
    public List<Characteristic> getCharacteristicsForDevice(String deviceIdentifier, String serviceUUID) throws BleError {
        Log.i(TAG, "getCharacteristicsForDevice called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainer(deviceIdentifier);

        if (deviceContainer == null) {
            throw new BleError(BleErrorCode.DeviceNotFound, "Device unknown", 0);
        }

        if (!deviceContainer.isConnected()) {
            throw new BleError(BleErrorCode.DeviceNotConnected, "Device not connected", 0);
        }

        if (deviceContainer.getCachedService(serviceUUID) == null || deviceContainer.getCachedService(serviceUUID).getCharacteristics().isEmpty()) {
            throw new BleError(BleErrorCode.CharacteristicsNotDiscovered, "Discovery not done for this peripheral", 0);
        }

        return deviceContainer.getCachedService(serviceUUID).getCharacteristics();
    }

    @Override
    public List<Characteristic> getCharacteristicsForService(int serviceIdentifier) throws BleError {
        Log.i(TAG, "getCharacteristicsForService called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainerForGattId(serviceIdentifier);

        if (deviceContainer == null) {
            throw new BleError(BleErrorCode.DeviceNotFound, "Device unknown", 0);
        }

        if (!deviceContainer.isConnected()) {
            throw new BleError(BleErrorCode.DeviceNotConnected, "Device not connected", 0);
        }

        if (deviceContainer.getCachedService(serviceIdentifier) == null
                || deviceContainer.getCachedService(serviceIdentifier).getCharacteristics().isEmpty()) {
            throw new BleError(BleErrorCode.CharacteristicsNotDiscovered, "Discovery not done for this peripheral", 0);
        }

        return deviceContainer.getCachedService(serviceIdentifier).getCharacteristics();
    }

    @Override
    public List<Descriptor> descriptorsForDevice(String deviceIdentifier, String serviceUUID, String characteristicUUID) throws BleError {
        Log.i(TAG, "descriptorsForDevice called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainer(deviceIdentifier);

        if (deviceContainer == null) {
            throw new BleError(BleErrorCode.DeviceNotFound, "Device unknown", 0);
        }

        if (!deviceContainer.isConnected()) {
            throw new BleError(BleErrorCode.DeviceNotConnected, "Device not connected", 0);
        }

        if (deviceContainer.getCachedService(serviceUUID) == null || deviceContainer.getCachedService(serviceUUID).getCharacteristics().isEmpty()) {
            throw new BleError(BleErrorCode.ServicesNotDiscovered, "Discovery not done on this device", 0);
        }

        CachedCharacteristic characteristic = deviceContainer.getCachedService(serviceUUID).getCachedCharacteristic(characteristicUUID);
        if (characteristic == null) {
            throw new BleError(BleErrorCode.CharacteristicsNotDiscovered, "Discovery not done for this peripheral", 0);
        }
        return characteristic.getDescriptors();
    }

    @Override
    public List<Descriptor> descriptorsForService(int serviceIdentifier, String characteristicUUID) throws BleError {
        Log.i(TAG, "descriptorsForService called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainerForGattId(serviceIdentifier);

        if (deviceContainer == null) {
            throw new BleError(BleErrorCode.DeviceNotFound, "Device unknown", 0);
        }

        if (!deviceContainer.isConnected()) {
            throw new BleError(BleErrorCode.DeviceNotConnected, "Device not connected", 0);
        }

        if (deviceContainer.getCachedService(serviceIdentifier) == null || deviceContainer.getCachedService(serviceIdentifier).getCharacteristics().isEmpty()) {
            throw new BleError(BleErrorCode.ServicesNotDiscovered, "Discovery not done on this device", 0);
        }

        CachedCharacteristic characteristic = deviceContainer.getCachedService(serviceIdentifier).getCachedCharacteristic(characteristicUUID);
        if (characteristic == null) {
            throw new BleError(BleErrorCode.CharacteristicsNotDiscovered, "Discovery not done for this peripheral", 0);
        }

        return characteristic.getDescriptors();
    }

    @Override
    public List<Descriptor> descriptorsForCharacteristic(int characteristicIdentifier) throws BleError {
        Log.i(TAG, "descriptorsForCharacteristic called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainerForGattId(characteristicIdentifier);

        if (deviceContainer == null) {
            throw new BleError(BleErrorCode.DeviceNotFound, "Device unknown", 0);
        }

        if (!deviceContainer.isConnected()) {
            throw new BleError(BleErrorCode.DeviceNotConnected, "Device not connected", 0);
        }

        CachedCharacteristic characteristic = deviceContainer.getCachedCharacteristic(characteristicIdentifier);
        if (characteristic == null) {
            throw new BleError(BleErrorCode.CharacteristicsNotDiscovered, "Discovery not done for this peripheral", 0);
        }

        return characteristic.getDescriptors();
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
