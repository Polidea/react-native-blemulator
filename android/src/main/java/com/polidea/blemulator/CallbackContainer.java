package com.polidea.blemulator;

import com.polidea.multiplatformbleadapter.Characteristic;
import com.polidea.multiplatformbleadapter.OnErrorCallback;
import com.polidea.multiplatformbleadapter.OnEventCallback;

public class CallbackContainer {
    private OnEventCallback<Characteristic> onEventCallback;
    private OnErrorCallback onErrorCallback;

    public CallbackContainer(OnEventCallback<Characteristic> onEventCallback, OnErrorCallback onErrorCallback) {
        this.onEventCallback = onEventCallback;
        this.onErrorCallback = onErrorCallback;
    }

    public OnEventCallback<Characteristic> getOnEventCallback() {
        return onEventCallback;
    }

    public OnErrorCallback getOnErrorCallback() {
        return onErrorCallback;
    }
}
