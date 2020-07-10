package com.polidea.blemulator.parser;

import com.facebook.react.bridge.ReadableMap;
import com.polidea.blemulator.NativeArgumentName;
import com.polidea.multiplatformbleadapter.errors.BleError;
import com.polidea.multiplatformbleadapter.errors.BleErrorCode;

public class ErrorParser {
    public BleError parseError(ReadableMap mappedError) {
        BleErrorCode matchedErrorCode = BleErrorCode.UnknownError;
        int incomingErrorCode = mappedError.getInt(NativeArgumentName.ERROR_CODE);
        for (BleErrorCode value : BleErrorCode.values()) {
            if (value.code == incomingErrorCode) {
                matchedErrorCode = value;
                break;
            }
        }
        return new BleError(matchedErrorCode, mappedError.getString(NativeArgumentName.ERROR_MESSAGE), -1);
    }
}
