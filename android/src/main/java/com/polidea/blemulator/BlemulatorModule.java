package com.polidea.blemulator;

import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.polidea.multiplatformbleadapter.BleAdapter;
import com.polidea.multiplatformbleadapter.BleAdapterCreator;
import com.polidea.multiplatformbleadapter.BleAdapterFactory;

import androidx.annotation.Nullable;

public class BlemulatorModule extends ReactContextBaseJavaModule {

    private static final String TAG = BlemulatorModule.class.toString();

    private final PlatformToJsBridge jsBridge;
    private final JsCallHandler callHandler;

    public BlemulatorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        callHandler = new JsCallHandler();
        jsBridge = new PlatformToJsBridge(reactContext, callHandler);
    }

    @Override
    public String getName() {
        return "Blemulator";
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
    public void sampleMethod(String stringArgument, int numberArgument, Callback callback) {
        // TODO: Implement some actually useful functionality
        callback.invoke("Received numberArgument: " + numberArgument + " stringArgument: " + stringArgument);
    }

    @ReactMethod
    public void simulate(final Promise promise) {
        Log.d(TAG, "Turn on BLE simulation");
        BleAdapterFactory.setBleAdapterCreator(new BleAdapterCreator() {
            @Override
            public BleAdapter createAdapter(Context context) {
                SimulatedAdapter adapter = new SimulatedAdapter();
                return adapter;
            }
        });
        promise.resolve(true);
    }
}
