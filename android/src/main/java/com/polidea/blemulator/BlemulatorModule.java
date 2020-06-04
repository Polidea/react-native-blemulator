package com.polidea.blemulator;

import android.content.Context;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.polidea.blemulator.parser.ReadableArrayToListParser;
import com.polidea.blemulator.parser.ReadableMapToMapParser;
import com.polidea.multiplatformbleadapter.AdvertisementData;
import com.polidea.multiplatformbleadapter.BleAdapter;
import com.polidea.multiplatformbleadapter.BleAdapterCreator;
import com.polidea.multiplatformbleadapter.BleAdapterFactory;
import com.polidea.multiplatformbleadapter.ScanResult;

import java.util.List;
import java.util.UUID;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class BlemulatorModule extends ReactContextBaseJavaModule {

    private static final String TAG = BlemulatorModule.class.toString();

    private final PlatformToJsBridge jsBridge;
    private final JsCallHandler callHandler;
    private SimulatedAdapter adapter = null;

    public BlemulatorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        callHandler = new JsCallHandler();
        jsBridge = new PlatformToJsBridge(reactContext, callHandler);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        //TODO should we update context for sending events?
    }

    @Override
    public String getName() {
        return "Blemulator";
    }

    public void registerAdapter(@NonNull SimulatedAdapter adapter) {
        if (this.adapter != null) {
            throw new IllegalStateException("Attempting to overwrite adapter");
        }
        this.adapter = adapter;
    }

    public void deregisterAdapter() {
        this.adapter = null;
    }

    @ReactMethod
    public void runTest() {
        Log.d(TAG, "Initiating test");
        jsBridge.test();
    }

    @ReactMethod
    public void handleReturnCall(String callId, @Nullable ReadableMap args) {
        callHandler.handleReturnCall(callId, args);
    }

    @ReactMethod
    public void addScanResult(ReadableMap scanResult) {
        //TODO handle errors (#12)

        List<UUID> overflowServiceUuidsList = ReadableArrayToListParser.parse(scanResult.getArray("overflowServiceUuids"));
        UUID[] overflowServiceUuids = null;
        if (overflowServiceUuidsList != null) {
            overflowServiceUuids = overflowServiceUuidsList.toArray(new UUID[overflowServiceUuidsList.size()]);
        }

        ScanResult result = new ScanResult(
                scanResult.getString("id"),
                scanResult.getString("name"),
                scanResult.getInt("rssi"),
                -1,
                scanResult.getBoolean("isConnectable"),
                overflowServiceUuids,
                new AdvertisementData(
                        Base64.decode(scanResult.getString("manufacturerData"), 0),
                        ReadableMapToMapParser.parse(scanResult.getMap("servicaData")),
                        ReadableArrayToListParser.parse(scanResult.getArray("serviceUuids")),
                        scanResult.getString("localName"),
                        scanResult.getInt("txPowerLevel"),
                        ReadableArrayToListParser.parse(scanResult.getArray("solicitedServiceUuids"))
                )
        );
        adapter.addScanResult(result);
    }

    @ReactMethod
    public void sampleMethod(String stringArgument, int numberArgument, Callback callback) {
        // TODO: Implement some actually useful functionality
        callback.invoke("Received numberArgument: " + numberArgument + " stringArgument: " + stringArgument);
    }

    @ReactMethod
    public void simulate(final Promise promise) {
        Log.d(TAG, "Turn on BLE simulation");
        final BlemulatorModule that = this;
        BleAdapterFactory.setBleAdapterCreator(new BleAdapterCreator() {
            @Override
            public BleAdapter createAdapter(Context context) {
                SimulatedAdapter adapter = new SimulatedAdapter(that, jsBridge);
                return adapter;
            }
        });
        promise.resolve(true);
    }
}
