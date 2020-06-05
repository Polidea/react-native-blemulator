package com.polidea.blemulator;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.polidea.multiplatformbleadapter.OnErrorCallback;
import com.polidea.multiplatformbleadapter.errors.BleError;
import com.polidea.multiplatformbleadapter.errors.BleErrorCode;

import androidx.annotation.Nullable;

public class PlatformToJsBridge {
    private static final String TAG = PlatformToJsBridge.class.getSimpleName();
    private final ReactContext reactContext;
    private final JsCallHandler callHandler;

    public PlatformToJsBridge(ReactContext reactContext, JsCallHandler callHandler) {
        this.reactContext = reactContext;
        this.callHandler = callHandler;
    }

    public void test() {
        final String LOCAL_TAG = "BRIDGE TEST";
        Log.d(LOCAL_TAG, "Starting test");
        Handler handler = new Handler(Looper.getMainLooper());

        for (int i = 0; i < 5; i++) {
            final int index = i;
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    Log.d(LOCAL_TAG, "Calling JS method, call index: " + index);
                    JsCallHandler.Callback callback = new JsCallHandler.Callback() {
                        @Override
                        public void invoke(ReadableMap args) {
                            Log.d(LOCAL_TAG, "Returning call: " + index + " | Received data: " + args.getString("testProperty"));
                        }
                    };
                    callMethod(MethodName.TEST, null, callback);
                }
            }, i * 1000);
        }
    }

    public void startScan(String[] filteredUUIDs,
                          int scanMode,
                          int callbackType,
                          final OnErrorCallback onErrorCallback) {
        WritableMap params = Arguments.createMap();

        if (filteredUUIDs != null) {
            params.putArray(JsArgumentName.FILTERED_UUIDS, Arguments.fromArray(filteredUUIDs));
        } else {
            params.putArray(JsArgumentName.FILTERED_UUIDS, null);
        }

        params.putInt(JsArgumentName.CALLBACK_TYPE, callbackType);
        params.putInt(JsArgumentName.SCAN_MODE, scanMode);

        callMethod(
                MethodName.START_SCAN,
                params,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        if (args.hasKey(NativeArgumentName.ERROR)) {
                            //TODO proper error handling (#12)
                            onErrorCallback.onError(new BleError(BleErrorCode.UnknownError, "", -1));
                        }
                    }
                }
        );
    }

    public void stopScan() {
        callMethod(MethodName.STOP_SCAN, null, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                Log.d(TAG, "stopScan callback called");
                //TODO can this throw errors? If so they'll be passed in the callback
            }
        });
    }

    private void callMethod(String methodName, @Nullable ReadableMap arguments, JsCallHandler.Callback callback) {
        WritableMap params = Arguments.createMap();
        String callbackId = callHandler.addCallback(callback);
        params.putString("methodName", methodName);
        params.putString("callbackId", callbackId);
        params.putMap("arguments", arguments);
        callJsMethod(params);
    }

    private void callJsMethod(ReadableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("MethodCall", params);
    }
}
