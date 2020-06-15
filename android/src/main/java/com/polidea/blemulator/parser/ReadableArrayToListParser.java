package com.polidea.blemulator.parser;

import com.facebook.react.bridge.ReadableArray;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ReadableArrayToListParser {
    public static List<UUID> parse(ReadableArray source) {
        if (source == null) return null;

        List<UUID> list = new ArrayList<>();

        for (int i = 0; i < source.size(); i++) {
            list.add(UUID.fromString(source.getString(i)));
        }

        return list;
    }
}
