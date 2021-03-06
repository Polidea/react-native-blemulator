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
import com.polidea.multiplatformbleadapter.errors.BleErrorUtils;
import com.polidea.multiplatformbleadapter.utils.Constants;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SimulatedAdapter implements BleAdapter {

    private static final String TAG = SimulatedAdapter.class.getName();
    private final BlemulatorModule module;
    private final PlatformToJsBridge bridge;
    private static final int UNUSED_ANDROID_ERROR_CODE = 0;

    private @Constants.BluetoothState
    String adapterState = Constants.BluetoothState.UNKNOWN;
    private OnEventCallback<String> onAdapterStateChangeCallback = null;
    private CallbackContainer<ScanResult> scanResultCallbackContainer = null;
    private DeviceManager deviceManager = new DeviceManager();
    private Map<String, OnEventCallback<ConnectionState>> connectionStateCallbacks = new HashMap<>();
    private Map<String, CallbackContainer<Characteristic>> monitoringCallbacks = new HashMap<>();
    private @Constants.BluetoothLogLevel String logLevel = Constants.BluetoothLogLevel.VERBOSE;

    public SimulatedAdapter(BlemulatorModule module, PlatformToJsBridge bridge) {
        this.module = module;
        this.bridge = bridge;
    }

    public void addScanResult(ScanResult scanResult, BleError error) {
        if (error != null) {
            scanResultCallbackContainer.getOnErrorCallback().onError(error);
            stopDeviceScan();
            return;
        }

        if (scanResultCallbackContainer != null) {
            scanResultCallbackContainer.getOnEventCallback().onEvent(scanResult);
        }
        deviceManager.addDeviceIfUnknown(scanResult.getDeviceId(), scanResult.getDeviceName());
    }

    public void publishAdapterState(@Constants.BluetoothState String newState) {
        adapterState = newState;
        if (onAdapterStateChangeCallback != null) {
            onAdapterStateChangeCallback.onEvent(newState);
        }
    }

    public void publishNotification(String transactionId, Characteristic characteristic, BleError error) {
        if (monitoringCallbacks.containsKey(transactionId)) {
            if (characteristic != null) {
                monitoringCallbacks.get(transactionId).getOnEventCallback().onEvent(characteristic);
            } else if (error != null) {
                monitoringCallbacks.get(transactionId).getOnErrorCallback().onError(error);
                monitoringCallbacks.remove(transactionId);
            } else {
                Log.w(TAG, "publishNotification called without valid arguments");
            }
        } else {
            Log.e(TAG, "Trying to publish unmonitored characteristic");
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
    public void startDeviceScan(String[] filteredUUIDs,
                                int scanMode,
                                int callbackType,
                                OnEventCallback<ScanResult> onEventCallback,
                                OnErrorCallback onErrorCallback) {
        Log.i(TAG, "startDeviceScan called");
        if (scanResultCallbackContainer == null) {
            bridge.startScan(filteredUUIDs, scanMode, callbackType, onErrorCallback);
            scanResultCallbackContainer = new CallbackContainer<>(onEventCallback, onErrorCallback);
        } else {
            throw new IllegalStateException("Scan already in progress");
        }
    }

    @Override
    public void stopDeviceScan() {
        Log.i(TAG, "stopDeviceScan called");
        bridge.stopScan();
        scanResultCallbackContainer = null;
    }

    @Override
    public void requestConnectionPriorityForDevice(String deviceIdentifier,
                                                   int connectionPriority,
                                                   String transactionId,
                                                   OnSuccessCallback<Device> onSuccessCallback,
                                                   OnErrorCallback onErrorCallback) {
        Log.i(TAG, "requestConnectionPriorityForDevice called");
        bridge.requestConnectionPriorityForDevice(
                deviceIdentifier,
                connectionPriority,
                transactionId,
                onSuccessCallback,
                onErrorCallback
        );
    }

    @Override
    public void readRSSIForDevice(String deviceIdentifier,
                                  String transactionId,
                                  OnSuccessCallback<Device> onSuccessCallback,
                                  OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readRSSIForDevice called");
        bridge.readRSSIForDevice(deviceIdentifier, transactionId, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void requestMTUForDevice(final String deviceIdentifier,
                                    int mtu,
                                    String transactionId,
                                    final OnSuccessCallback<Device> onSuccessCallback,
                                    OnErrorCallback onErrorCallback) {
        Log.i(TAG, "requestMTUForDevice called, mtu: " + mtu);
        OnSuccessCallback<Integer> modifiedOnSuccessCallback = new OnSuccessCallback<Integer>() {
            @Override
            public void onSuccess(Integer mtu) {
                Device device = deviceManager.getDeviceContainer(deviceIdentifier).getDevice();
                device.setMtu(mtu);
                onSuccessCallback.onSuccess(device);
            }
        };
        bridge.requestMtu(deviceIdentifier, mtu, transactionId, modifiedOnSuccessCallback, onErrorCallback);
    }

    @Override
    public void getKnownDevices(String[] deviceIdentifiers,
                                OnSuccessCallback<Device[]> onSuccessCallback,
                                OnErrorCallback onErrorCallback) {
        Log.i(TAG, "getKnownDevices called");
        bridge.getKnownDevices(deviceIdentifiers, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void getConnectedDevices(String[] serviceUUIDs,
                                    OnSuccessCallback<Device[]> onSuccessCallback,
                                    OnErrorCallback onErrorCallback) {
        Log.i(TAG, "getConnectedDevices called");
        bridge.getConnectedDevices(serviceUUIDs, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void connectToDevice(final String deviceIdentifier,
                                ConnectionOptions connectionOptions,
                                final OnSuccessCallback<Device> onSuccessCallback,
                                OnEventCallback<ConnectionState> onConnectionStateChangedCallback,
                                OnErrorCallback onErrorCallback) {
        Log.i(TAG, "connectToDevice called");
        deviceManager.addDeviceIfUnknown(deviceIdentifier, null);
        connectionStateCallbacks.put(deviceIdentifier, onConnectionStateChangedCallback);
        OnSuccessCallback<Device> modifiedOnSuccessCallback = new OnSuccessCallback<Device>() {
            @Override
            public void onSuccess(Device data) {
                deviceManager.updateDevice(deviceIdentifier, data.getName());
                onSuccessCallback.onSuccess(data);
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

        gattAccessAsserts(deviceContainer);

        return deviceContainer.getServices();
    }

    @Override
    public List<Characteristic> getCharacteristicsForDevice(String deviceIdentifier, String serviceUUID) throws BleError {
        Log.i(TAG, "getCharacteristicsForDevice called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainer(deviceIdentifier);

        gattAccessAsserts(deviceContainer);
        assertServiceFound(deviceContainer.getCachedService(serviceUUID));

        return deviceContainer.getCachedService(serviceUUID).getCharacteristics();
    }

    @Override
    public List<Characteristic> getCharacteristicsForService(int serviceIdentifier) throws BleError {
        Log.i(TAG, "getCharacteristicsForService called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainerForGattId(serviceIdentifier);

        gattAccessAsserts(deviceContainer);
        assertServiceFound(deviceContainer.getCachedService(serviceIdentifier));

        return deviceContainer.getCachedService(serviceIdentifier).getCharacteristics();
    }

    @Override
    public List<Descriptor> descriptorsForDevice(String deviceIdentifier, String serviceUUID, String characteristicUUID) throws BleError {
        Log.i(TAG, "descriptorsForDevice called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainer(deviceIdentifier);

        gattAccessAsserts(deviceContainer);
        assertServiceFound(deviceContainer.getCachedService(serviceUUID));

        CachedCharacteristic characteristic = deviceContainer.getCachedService(serviceUUID).getCachedCharacteristic(characteristicUUID);
        assertServiceFound(characteristic);
        return characteristic.getDescriptors();
    }

    @Override
    public List<Descriptor> descriptorsForService(int serviceIdentifier, String characteristicUUID) throws BleError {
        Log.i(TAG, "descriptorsForService called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainerForGattId(serviceIdentifier);

        gattAccessAsserts(deviceContainer);
        assertServiceFound(deviceContainer.getCachedService(serviceIdentifier));

        CachedCharacteristic characteristic = deviceContainer.getCachedService(serviceIdentifier).getCachedCharacteristic(characteristicUUID);
        assertServiceFound(characteristic);

        return characteristic.getDescriptors();
    }

    @Override
    public List<Descriptor> descriptorsForCharacteristic(int characteristicIdentifier) throws BleError {
        Log.i(TAG, "descriptorsForCharacteristic called");

        DeviceContainer deviceContainer = deviceManager.getDeviceContainerForGattId(characteristicIdentifier);

        gattAccessAsserts(deviceContainer);

        CachedCharacteristic characteristic = deviceContainer.getCachedCharacteristic(characteristicIdentifier);
        assertServiceFound(characteristic);

        return characteristic.getDescriptors();
    }

    private void gattAccessAsserts(DeviceContainer deviceContainer) throws BleError {
        assertBluetoothSupported();
        assertBluetoothOn();
        assertDeviceKnown(deviceContainer);
        assertDeviceConnected(deviceContainer);
        assertDiscoveryDone(deviceContainer);
    }

    private void assertBluetoothSupported() throws BleError {
        if (adapterState.equals(Constants.BluetoothState.UNSUPPORTED)) {
            throw new BleError(BleErrorCode.BluetoothUnsupported, "BT not supported", UNUSED_ANDROID_ERROR_CODE);
        }
    }

    private void assertBluetoothOn() throws BleError {
        if (!adapterState.equals(Constants.BluetoothState.POWERED_ON)) {
            throw new BleError(BleErrorCode.BluetoothResetting, "BT not on", UNUSED_ANDROID_ERROR_CODE);
        }
    }

    private void assertDeviceKnown(DeviceContainer deviceContainer) throws BleError {
        if (deviceContainer == null) {
            throw new BleError(BleErrorCode.DeviceNotFound, "Device unknown", UNUSED_ANDROID_ERROR_CODE);
        }
    }

    private void assertDeviceConnected(DeviceContainer deviceContainer) throws BleError {
        if (!deviceContainer.isConnected()) {
            throw new BleError(BleErrorCode.DeviceNotConnected, "Device not connected", UNUSED_ANDROID_ERROR_CODE);
        }
    }

    private void assertDiscoveryDone(DeviceContainer deviceContainer) throws BleError {
        if (deviceContainer.getServices().isEmpty()) {
            throw new BleError(BleErrorCode.ServicesNotDiscovered, "Discovery not done on this device", UNUSED_ANDROID_ERROR_CODE);
        }
    }

    private void assertServiceFound(CachedService service) throws BleError {
        if (service == null) {
            throw new BleError(BleErrorCode.ServicesNotDiscovered, "Discovery not done on this device", UNUSED_ANDROID_ERROR_CODE);
        }
    }

    private void assertServiceFound(CachedCharacteristic characteristic) throws BleError {
        if (characteristic == null) {
            throw new BleError(BleErrorCode.CharacteristicsNotDiscovered, "Discovery not done for this peripheral", UNUSED_ANDROID_ERROR_CODE);
        }
    }

    @Override
    public void readCharacteristicForDevice(String deviceIdentifier,
                                            String serviceUUID,
                                            String characteristicUUID,
                                            String transactionId,
                                            OnSuccessCallback<Characteristic> onSuccessCallback,
                                            OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readCharacteristicForDevice called");
        bridge.readCharacteristicForDevice(deviceIdentifier, serviceUUID, characteristicUUID, transactionId, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void readCharacteristicForService(int serviceIdentifier,
                                             String characteristicUUID,
                                             String transactionId,
                                             OnSuccessCallback<Characteristic> onSuccessCallback,
                                             OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readCharacteristicForService called");
        bridge.readCharacteristicForService(serviceIdentifier, characteristicUUID, transactionId, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void readCharacteristic(int characteristicIdentifer,
                                   String transactionId,
                                   OnSuccessCallback<Characteristic> onSuccessCallback,
                                   OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readCharacteristic called");
        bridge.readCharacteristic(characteristicIdentifer, transactionId, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void writeCharacteristicForDevice(String deviceIdentifier,
                                             String serviceUUID,
                                             String characteristicUUID,
                                             String valueBase64,
                                             boolean withResponse,
                                             String transactionId,
                                             OnSuccessCallback<Characteristic> onSuccessCallback,
                                             OnErrorCallback onErrorCallback) {
        Log.i(TAG, "writeCharacteristicForDevice called");
        bridge.writeCharacteristicForDevice(
                deviceIdentifier,
                serviceUUID,
                characteristicUUID,
                valueBase64,
                withResponse,
                transactionId,
                onSuccessCallback,
                onErrorCallback
        );
    }

    @Override
    public void writeCharacteristicForService(int serviceIdentifier,
                                              String characteristicUUID,
                                              String valueBase64,
                                              boolean withResponse,
                                              String transactionId,
                                              OnSuccessCallback<Characteristic> onSuccessCallback,
                                              OnErrorCallback onErrorCallback) {
        Log.i(TAG, "writeCharacteristicForService called");
        bridge.writeCharacteristicForService(
                serviceIdentifier,
                characteristicUUID,
                valueBase64,
                withResponse,
                transactionId,
                onSuccessCallback,
                onErrorCallback
        );
    }

    @Override
    public void writeCharacteristic(int characteristicIdentifier,
                                    String valueBase64,
                                    boolean withResponse,
                                    String transactionId,
                                    OnSuccessCallback<Characteristic> onSuccessCallback,
                                    OnErrorCallback onErrorCallback) {
        Log.i(TAG, "writeCharacteristic called");
        bridge.writeCharacteristic(
                characteristicIdentifier,
                valueBase64,
                withResponse,
                transactionId,
                onSuccessCallback,
                onErrorCallback
        );
    }

    @Override
    public void monitorCharacteristicForDevice(String deviceIdentifier,
                                               String serviceUUID,
                                               String characteristicUUID,
                                               String transactionId,
                                               OnEventCallback<Characteristic> onEventCallback,
                                               OnErrorCallback onErrorCallback) {
        Log.i(TAG, "monitorCharacteristicForDevice called");
        handleNewMonitoringTransaction(onEventCallback, onErrorCallback, transactionId);
        bridge.monitorCharacteristicForDevice(deviceIdentifier, serviceUUID, characteristicUUID, transactionId);
    }

    @Override
    public void monitorCharacteristicForService(int serviceIdentifier,
                                                String characteristicUUID,
                                                String transactionId,
                                                OnEventCallback<Characteristic> onEventCallback,
                                                OnErrorCallback onErrorCallback) {
        Log.i(TAG, "monitorCharacteristicForService called");
        handleNewMonitoringTransaction(onEventCallback, onErrorCallback, transactionId);
        bridge.monitorCharacteristicForService(serviceIdentifier, characteristicUUID, transactionId);
    }

    @Override
    public void monitorCharacteristic(int characteristicIdentifier,
                                      String transactionId,
                                      OnEventCallback<Characteristic> onEventCallback,
                                      OnErrorCallback onErrorCallback) {
        Log.i(TAG, "monitorCharacteristic called");
        handleNewMonitoringTransaction(onEventCallback, onErrorCallback, transactionId);
        bridge.monitorCharacteristic(characteristicIdentifier, transactionId);
    }

    private void handleNewMonitoringTransaction(OnEventCallback<Characteristic> onEventCallback, OnErrorCallback onErrorCallback, String transactionId) {
        if (monitoringCallbacks.containsKey(transactionId)) {
            Log.w(TAG, "Monitoring called reusing existing transactionId");
            monitoringCallbacks.get(transactionId).getOnErrorCallback().onError(BleErrorUtils.cancelled());
        }
        monitoringCallbacks.put(transactionId, new CallbackContainer<>(onEventCallback, onErrorCallback));
    }

    @Override
    public void readDescriptorForDevice(String deviceId,
                                        String serviceUUID,
                                        String characteristicUUID,
                                        String descriptorUUID,
                                        String transactionId,
                                        OnSuccessCallback<Descriptor> successCallback,
                                        OnErrorCallback errorCallback) {
        Log.i(TAG, "readDescriptorForDevice called");
        bridge.readDescriptorForDevice(deviceId, serviceUUID,
                characteristicUUID, descriptorUUID, transactionId, successCallback, errorCallback
        );
    }

    @Override
    public void readDescriptorForService(int serviceIdentifier,
                                         String characteristicUUID,
                                         String descriptorUUID,
                                         String transactionId,
                                         OnSuccessCallback<Descriptor> successCallback,
                                         OnErrorCallback errorCallback) {
        Log.i(TAG, "readDescriptorForService called");
        bridge.readDescriptorForService(serviceIdentifier,
                characteristicUUID, descriptorUUID, transactionId, successCallback, errorCallback
        );
    }

    @Override
    public void readDescriptorForCharacteristic(int characteristicIdentifier,
                                                String descriptorUUID,
                                                String transactionId,
                                                OnSuccessCallback<Descriptor> successCallback,
                                                OnErrorCallback errorCallback) {
        Log.i(TAG, "readDescriptorForCharacteristic called");
        bridge.readDescriptorForCharacteristic(characteristicIdentifier,
                descriptorUUID, transactionId, successCallback, errorCallback
        );
    }

    @Override
    public void readDescriptor(int descriptorIdentifier,
                               String transactionId,
                               OnSuccessCallback<Descriptor> onSuccessCallback,
                               OnErrorCallback onErrorCallback) {
        Log.i(TAG, "readDescriptor called");
        bridge.readDescriptor(descriptorIdentifier, transactionId, onSuccessCallback, onErrorCallback);
    }

    @Override
    public void writeDescriptorForDevice(String deviceId,
                                         String serviceUUID,
                                         String characteristicUUID,
                                         String descriptorUUID,
                                         String valueBase64,
                                         String transactionId,
                                         OnSuccessCallback<Descriptor> successCallback,
                                         OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptorForDevice called");
        bridge.writeDescriptorForDevice(
                deviceId,
                serviceUUID,
                characteristicUUID,
                descriptorUUID,
                valueBase64,
                transactionId,
                successCallback,
                errorCallback
        );
    }

    @Override
    public void writeDescriptorForService(int serviceIdentifier,
                                          String characteristicUUID,
                                          String descriptorUUID,
                                          String valueBase64,
                                          String transactionId,
                                          OnSuccessCallback<Descriptor> successCallback,
                                          OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptorForService called");
        bridge.writeDescriptorForService(
                serviceIdentifier,
                characteristicUUID,
                descriptorUUID,
                valueBase64,
                transactionId,
                successCallback,
                errorCallback
        );
    }

    @Override
    public void writeDescriptorForCharacteristic(int characteristicIdentifier,
                                                 String descriptorUUID,
                                                 String valueBase64,
                                                 String transactionId,
                                                 OnSuccessCallback<Descriptor> successCallback,
                                                 OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptorForCharacteristic called");
        bridge.writeDescriptorForCharacteristic(
                characteristicIdentifier,
                descriptorUUID,
                valueBase64,
                transactionId,
                successCallback,
                errorCallback
        );
    }

    @Override
    public void writeDescriptor(int descriptorIdentifier,
                                String valueBase64,
                                String transactionId,
                                OnSuccessCallback<Descriptor> successCallback,
                                OnErrorCallback errorCallback) {
        Log.i(TAG, "writeDescriptor called");
        bridge.writeDescriptor(
                descriptorIdentifier,
                valueBase64,
                transactionId,
                successCallback,
                errorCallback
        );
    }

    @Override
    public void cancelTransaction(String transactionId) {
        Log.i(TAG, "cancelTransaction called");
        bridge.cancelTransaction(transactionId);
    }

    @Override
    public void setLogLevel(@Constants.BluetoothLogLevel String logLevel) {
        Log.i(TAG, "setLogLevel called");
        this.logLevel = logLevel;
    }

    @Override
    public @Constants.BluetoothLogLevel String getLogLevel() {
        Log.i(TAG, "getLogLevel called");
        return logLevel;
    }
}
