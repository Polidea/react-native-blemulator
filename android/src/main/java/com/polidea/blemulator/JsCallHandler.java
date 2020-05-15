package com.polidea.blemulator;

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

    public void handleReturnCall(String id, String jsonString) {
        if (callbacks.containsKey(id)) {
            Callback callback = callbacks.get(id);
            if (callback == null) {
                throw new IllegalStateException("Callback not set for provided id " + id);
            }
            callback.invoke(jsonString);
            callbacks.remove(id);
        } else {
            throw new IllegalStateException("Unknown callback ID " + id);
        }
    }

    interface Callback {
        void  invoke(String jsonString);
    }
}
