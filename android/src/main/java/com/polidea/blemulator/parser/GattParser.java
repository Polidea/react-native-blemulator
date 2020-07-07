package com.polidea.blemulator.parser;

import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.util.Base64;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.polidea.blemulator.NativeArgumentName;
import com.polidea.blemulator.containers.CachedCharacteristic;
import com.polidea.blemulator.containers.CachedService;
import com.polidea.multiplatformbleadapter.Characteristic;
import com.polidea.multiplatformbleadapter.Descriptor;
import com.polidea.multiplatformbleadapter.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.polidea.multiplatformbleadapter.utils.Constants.CLIENT_CHARACTERISTIC_CONFIG_UUID;

public class GattParser {
    public CachedCharacteristic parseCharacteristic(ReadableMap serializedCharacteristic, Service service) {
        String uuid = serializedCharacteristic.getString(NativeArgumentName.UUID);
        int id = serializedCharacteristic.getInt(NativeArgumentName.ID);
        int properties = 0;
        properties |= serializedCharacteristic.getBoolean(NativeArgumentName.IS_READABLE) ? BluetoothGattCharacteristic.PROPERTY_READ : 0;
        properties |= serializedCharacteristic.getBoolean(NativeArgumentName.IS_WRITABLE_WITH_RESPONSE) ? BluetoothGattCharacteristic.PROPERTY_WRITE : 0;
        properties |= serializedCharacteristic.getBoolean(NativeArgumentName.IS_WRITABLE_WITHOUT_RESPONSE) ? BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE : 0;
        properties |= serializedCharacteristic.getBoolean(NativeArgumentName.IS_NOTIFIABLE) ? BluetoothGattCharacteristic.PROPERTY_NOTIFY : 0;
        properties |= serializedCharacteristic.getBoolean(NativeArgumentName.IS_INDICATABLE) ? BluetoothGattCharacteristic.PROPERTY_INDICATE : 0;

        BluetoothGattCharacteristic btCharacteristic = new BluetoothGattCharacteristic(UUID.fromString(uuid), properties, 0);
        BluetoothGattDescriptor clientConfigDescriptor = new BluetoothGattDescriptor(CLIENT_CHARACTERISTIC_CONFIG_UUID, 0);
        clientConfigDescriptor.setValue(serializedCharacteristic.getBoolean(NativeArgumentName.IS_NOTIFYING) ? new byte[]{0x01} : new byte[]{0x00});
        btCharacteristic.addDescriptor(clientConfigDescriptor);

        if (service == null) {
            int serviceId = serializedCharacteristic.getInt(NativeArgumentName.SERVICE_ID);
            String serviceUuid = serializedCharacteristic.getString(NativeArgumentName.SERVICE_UUID);
            BluetoothGattService btService = new BluetoothGattService(UUID.fromString(serviceUuid), BluetoothGattService.SERVICE_TYPE_PRIMARY);
            String deviceId = serializedCharacteristic.getString(NativeArgumentName.DEVICE_ID);
            service = new Service(serviceId, deviceId, btService);
        }

        Characteristic characteristic = new Characteristic(id, service, btCharacteristic);
        String valueBase64 = serializedCharacteristic.getString(NativeArgumentName.VALUE);
        if (valueBase64 != null) {
            characteristic.setValue(Base64.decode(valueBase64, 0));
        }
        CachedCharacteristic cachedCharacteristic = new CachedCharacteristic(characteristic);

        List<Descriptor> descriptors = parseDescriptors(serializedCharacteristic.getArray(NativeArgumentName.DESCRIPTORS));
        for (Descriptor descriptor : descriptors) {
            cachedCharacteristic.addDescriptor(descriptor);
        }

        return cachedCharacteristic;
    }

    public List<CachedService> parseDiscoveryResponse(ReadableArray response) {
        ArrayList<CachedService> result = new ArrayList<>();

        if (response == null) return result;

        for (int i = 0; i < response.size(); i++) {
            ReadableMap serializedService = response.getMap(i);
            String deviceId = serializedService.getString(NativeArgumentName.DEVICE_ID);
            int id = serializedService.getInt(NativeArgumentName.ID);
            String uuid = serializedService.getString(NativeArgumentName.UUID);
            Service service = new Service(id, deviceId, new BluetoothGattService(UUID.fromString(uuid), BluetoothGattService.SERVICE_TYPE_PRIMARY));
            CachedService cachedService = new CachedService(service);
            List<CachedCharacteristic> characteristics = parseCharacteristics(service, serializedService.getArray(NativeArgumentName.CHARACTERISTICS));
            for (CachedCharacteristic cachedCharacteristic : characteristics) {
                cachedService.addCharacteristic(cachedCharacteristic);
            }
            result.add(cachedService);
        }


        return result;
    }

    private List<CachedCharacteristic> parseCharacteristics(Service service, ReadableArray response) {
        ArrayList<CachedCharacteristic> result = new ArrayList<>();

        if (response == null) return result;

        for (int i = 0; i < response.size(); i++) {
            ReadableMap serializedCharacteristic = response.getMap(i);
            CachedCharacteristic cachedCharacteristic = parseCharacteristic(serializedCharacteristic, service);
            result.add(cachedCharacteristic);
        }

        return result;
    }

    private List<Descriptor> parseDescriptors(ReadableArray response) {
        ArrayList<Descriptor> result = new ArrayList<>();

        if (response == null) return result;

        for (int i = 0; i < response.size(); i++) {
            ReadableMap serializedDescriptor = response.getMap(i);

            String uuid = serializedDescriptor.getString(NativeArgumentName.UUID);
            String characteristicUuid = serializedDescriptor.getString(NativeArgumentName.CHARACTERISTIC_UUID);
            String serviceUuid = serializedDescriptor.getString(NativeArgumentName.SERVICE_UUID);
            String deviceId = serializedDescriptor.getString(NativeArgumentName.DEVICE_ID);
            int id = serializedDescriptor.getInt(NativeArgumentName.ID);
            int characteristicId = serializedDescriptor.getInt(NativeArgumentName.CHARACTERISTIC_ID);
            int serviceId = serializedDescriptor.getInt(NativeArgumentName.SERVICE_ID);

            BluetoothGattDescriptor btDescriptor = new BluetoothGattDescriptor(UUID.fromString(uuid), 0);
            Descriptor descriptor = new Descriptor(characteristicId,
                    serviceId, UUID.fromString(characteristicUuid),
                    UUID.fromString(serviceUuid),
                    deviceId, btDescriptor, id, UUID.fromString(uuid));

            result.add(descriptor);
        }

        return result;
    }
}
