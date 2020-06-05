package com.polidea.blemulator.parser;

import android.util.Base64;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.polidea.blemulator.NativeArgumentName;
import com.polidea.multiplatformbleadapter.AdvertisementData;
import com.polidea.multiplatformbleadapter.ScanResult;

import java.util.List;
import java.util.UUID;

public class ScanResultParser {
    public static ScanResult parse(ReadableMap scanResult) {
        String id = scanResult.getString("id");
        String name = scanResult.hasKey(NativeArgumentName.NAME) ? scanResult.getString(NativeArgumentName.NAME) : null;
        int rssi = scanResult.getInt("rssi");
        int mtu = -1; //should not be available on scan
        boolean isConnectable = false; //always false on Android
        ReadableArray jsOverflowServiceUuids = scanResult.hasKey(NativeArgumentName.OVERFLOW_SERVICE_UUIDS) ?
                scanResult.getArray(NativeArgumentName.OVERFLOW_SERVICE_UUIDS) : null;
        byte[] manufacturerData = scanResult.hasKey(NativeArgumentName.MANUFACTURER_DATA) ?
                Base64.decode(scanResult.getString(NativeArgumentName.MANUFACTURER_DATA), 0) : null;
        ReadableMap jsServiceData = scanResult.hasKey(NativeArgumentName.SERVICE_DATA) ?
                scanResult.getMap(NativeArgumentName.SERVICE_DATA) : null;
        ReadableArray jsServiceUuids = scanResult.hasKey(NativeArgumentName.SERVICE_UUIDS) ?
                scanResult.getArray(NativeArgumentName.SERVICE_UUIDS) : null;
        String localName = scanResult.hasKey(NativeArgumentName.LOCAL_NAME) ?
                scanResult.getString(NativeArgumentName.LOCAL_NAME) : null;
        Integer txPowerLevel = scanResult.hasKey(NativeArgumentName.TX_POWER_LEVEL) ?
                scanResult.getInt(NativeArgumentName.TX_POWER_LEVEL) : null;
        ReadableArray jsSolicitedServiceUuids = scanResult.hasKey(NativeArgumentName.SOLICITED_SERVICE_UUIDS) ?
                scanResult.getArray(NativeArgumentName.SOLICITED_SERVICE_UUIDS) : null;

        List<UUID> overflowServiceUuidsList = ReadableArrayToListParser.parse(jsOverflowServiceUuids);
        UUID[] overflowServiceUuids = null;
        if (overflowServiceUuidsList != null) {
            overflowServiceUuids = overflowServiceUuidsList.toArray(new UUID[overflowServiceUuidsList.size()]);
        }

        ScanResult result = new ScanResult(
                id,
                name,
                rssi,
                mtu,
                isConnectable,
                overflowServiceUuids,
                new AdvertisementData(
                        manufacturerData,
                        ReadableMapToMapParser.parse(jsServiceData),
                        ReadableArrayToListParser.parse(jsServiceUuids),
                        localName,
                        txPowerLevel,
                        ReadableArrayToListParser.parse(jsSolicitedServiceUuids)
                )
        );
        return result;
    }
}
