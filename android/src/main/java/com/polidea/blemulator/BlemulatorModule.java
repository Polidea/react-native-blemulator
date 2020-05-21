package com.polidea.blemulator;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.polidea.multiplatformbleadapter.ScanResult;

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
        ScanResult result = new ScanResult(); //TODO
        adapter.addScanResult(result);
    }

    @ReactMethod
    public void sampleMethod(String stringArgument, int numberArgument, Callback callback) {
        // TODO: Implement some actually useful functionality
        callback.invoke("Received numberArgument: " + numberArgument + " stringArgument: " + stringArgument);
    }
}
