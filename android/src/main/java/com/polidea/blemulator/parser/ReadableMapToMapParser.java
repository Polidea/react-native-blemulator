package com.polidea.blemulator.parser;

import android.util.Base64;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public class ReadableMapToMapParser {
    public static Map<UUID, byte[]> parse(ReadableMap source) {
        if (source == null) return null;

        LinkedHashMap<UUID, byte[]> map = new LinkedHashMap<>();

        ReadableMapKeySetIterator keySetIterator = source.keySetIterator();
        while (keySetIterator.hasNextKey()) {
            String key = keySetIterator.nextKey();
            map.put(
                    UUID.fromString(key),
                    Base64.decode(source.getString(key), 0)
            );
        }

        return map;
    }
}
