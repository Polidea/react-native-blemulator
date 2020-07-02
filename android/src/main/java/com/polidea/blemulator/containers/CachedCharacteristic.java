package com.polidea.blemulator.containers;

import com.polidea.multiplatformbleadapter.Characteristic;
import com.polidea.multiplatformbleadapter.Descriptor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CachedCharacteristic {
    private Characteristic characteristic;
    private Map<String, Descriptor> descriptorMap = new HashMap<>();

    public CachedCharacteristic(Characteristic characteristic) {
        this.characteristic = characteristic;
    }

    public Characteristic getCharacteristic() {
        return characteristic;
    }

    public void addDescriptor(Descriptor descriptor) {
        descriptorMap.put(descriptor.getUuid().toString().toLowerCase(), descriptor);
    }

    public Descriptor getDescriptor(String uuid) {
        return descriptorMap.get(uuid.toLowerCase());
    }

    public List<Descriptor> getDescriptors() {
        return new ArrayList<>(descriptorMap.values());
    }
}
