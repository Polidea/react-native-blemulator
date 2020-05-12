package com.reactlibrary;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import androidx.annotation.Nullable;

public class PlatformToJsBridge {
    private final ReactContext reactContext;
    private final JsCallHandler callHandler;

    public PlatformToJsBridge(ReactContext reactContext, JsCallHandler callHandler) {
        this.reactContext = reactContext;
        this.callHandler = callHandler;
    }

    private void callJsMethod(ReadableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("MethodCall", params);
    }

    public void test() {
        final String TAG = "BRIDGE TEST";
        Log.d(TAG, "Starting test");
        Handler handler = new Handler(Looper.getMainLooper());

        for (int i = 0; i < 5; i++) {
            final int index = i;
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    Log.d(TAG, "Calling JS method, call index: " + index);
                    JsCallHandler.Callback callback = new JsCallHandler.Callback() {
                        @Override
                        public void invoke(String jsonString) {
                            Log.d(TAG, "Returning call: " + index + " | Received data: " + jsonString);
                        }
                    };
                    callMethod(MethodName.TEST, null, callback);
                }
            }, i * 1000);
        }

    }

    private void callMethod(String methodName, @Nullable ReadableMap arguments, JsCallHandler.Callback callback) {
        WritableMap params = Arguments.createMap();
        String callbackId = callHandler.addCallback(callback);
        params.putString("methodName", methodName);
        params.putString("callbackId", callbackId);
        params.putMap("arguments", arguments);
        callJsMethod(params);
    }
}
