package com.polidea.blemulator;

import com.facebook.react.bridge.ReadableMap;

import java.util.HashMap;
import java.util.Map;

public class JsCallHandler {
    private int nextCallId = 0;
    private Map<String, Callback> callbacks = new HashMap<>();

    public String getNextCallbackId() {
        return Integer.toString(nextCallId++);
    }

    public String addCallback(Callback callback) {
        String callId = getNextCallbackId();
        callbacks.put(callId, callback);
        return callId;
    }

    public void handleReturnCall(String id, ReadableMap args) {
        if (!callbacks.containsKey(id)) {
            throw new IllegalStateException("Unknown callback ID " + id);
        }

        Callback callback = callbacks.get(id);
        if (callback == null) {
            throw new IllegalStateException("Callback not set for provided id " + id);
        }
        callback.invoke(args);
        callbacks.remove(id);
    }

    interface Callback {
        void  invoke(ReadableMap args);
    }
}
