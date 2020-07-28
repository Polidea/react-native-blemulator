package com.polidea.blemulator;

import com.polidea.multiplatformbleadapter.OnErrorCallback;
import com.polidea.multiplatformbleadapter.OnEventCallback;

public class CallbackContainer<T> {
    private OnEventCallback<T> onEventCallback;
    private OnErrorCallback onErrorCallback;

    public CallbackContainer(OnEventCallback<T> onEventCallback, OnErrorCallback onErrorCallback) {
        this.onEventCallback = onEventCallback;
        this.onErrorCallback = onErrorCallback;
    }

    public OnEventCallback<T> getOnEventCallback() {
        return onEventCallback;
    }

    public OnErrorCallback getOnErrorCallback() {
        return onErrorCallback;
    }
}
