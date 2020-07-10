package com.polidea.blemulator;

import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.polidea.blemulator.parser.ErrorParser;
import com.polidea.blemulator.parser.GattParser;
import com.polidea.blemulator.parser.ScanResultParser;
import com.polidea.multiplatformbleadapter.BleAdapter;
import com.polidea.multiplatformbleadapter.BleAdapterCreator;
import com.polidea.multiplatformbleadapter.BleAdapterFactory;
import com.polidea.multiplatformbleadapter.Characteristic;
import com.polidea.multiplatformbleadapter.ConnectionState;
import com.polidea.multiplatformbleadapter.ScanResult;
import com.polidea.multiplatformbleadapter.errors.BleError;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class BlemulatorModule extends ReactContextBaseJavaModule {

    private static final String TAG = BlemulatorModule.class.getName();

    private PlatformToJsBridge jsBridge;
    private JsCallHandler callHandler;
    private SimulatedAdapter adapter = null;
    private GattParser gattParser = new GattParser();
    private ErrorParser errorParser = new ErrorParser();

    public BlemulatorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        init();
    }

    private void init() {
        callHandler = new JsCallHandler();
        jsBridge = new PlatformToJsBridge(getReactApplicationContext(), callHandler);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        deregisterAdapter();
        init();
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
    public void handleReturnCall(String callId, @Nullable ReadableMap args) {
        callHandler.handleReturnCall(callId, args);
    }

    @ReactMethod
    public void publishAdapterState(String serializedAdapterState) {
        adapter.publishAdapterState(serializedAdapterState);
    }

    @ReactMethod
    public void addScanResult(ReadableMap scanResult) {
        //TODO handle errors (adapter powered off during scan, for example)
        ScanResult result = ScanResultParser.parse(scanResult);
        adapter.addScanResult(result);
    }

    @ReactMethod
    public void publishConnectionState(String peripheralId, String connectionState) {
        ConnectionState state = null;
        for (ConnectionState checkedState : ConnectionState.values()) {
            if (checkedState.value.equalsIgnoreCase(connectionState)) {
                state = checkedState;
                break;
            }
        }
        if (state == null) {
            throw new IllegalArgumentException(connectionState + " doesn't match any of the known values");
        }
        adapter.publishConnectionState(peripheralId, state);
    }

    @ReactMethod
    public void publishCharacteristicNotification(String transactionId, ReadableMap serializedCharacteristic, ReadableMap serializedError) {
        Log.d(TAG, "Received " + transactionId);
        Characteristic characteristic = serializedCharacteristic != null ? gattParser.parseCharacteristic(serializedCharacteristic, null).getCharacteristic() : null;
        BleError error = serializedError != null ? errorParser.parseError(serializedError) : null;
        adapter.publishNotification(
                transactionId,
                characteristic,
                error
        );
    }

    @ReactMethod
    public void simulate(final Promise promise) {
        Log.d(TAG, "Turn on BLE simulation");
        BleAdapterFactory.setBleAdapterCreator(new BleAdapterCreator() {
            @Override
            public BleAdapter createAdapter(Context context) {
                SimulatedAdapter adapter = new SimulatedAdapter(BlemulatorModule.this, jsBridge);
                return adapter;
            }
        });
        promise.resolve(true);
    }
}
