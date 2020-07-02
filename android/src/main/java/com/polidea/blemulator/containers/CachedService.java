package com.polidea.blemulator.containers;

import com.polidea.multiplatformbleadapter.Characteristic;
import com.polidea.multiplatformbleadapter.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CachedService {
    private Service service;
    private Map<String, CachedCharacteristic> characteristicMap = new HashMap<>();

    public CachedService(Service service) {
        this.service = service;
    }

    public Service getService() {
        return service;
    }

    public void addCharacteristic(CachedCharacteristic cachedCharacteristic) {
        characteristicMap.put(cachedCharacteristic.getCharacteristic().getUuid().toString().toLowerCase(), cachedCharacteristic);
    }

    public CachedCharacteristic getCachedCharacteristic(String uuid) {
        return characteristicMap.get(uuid.toLowerCase());
    }

    public List<CachedCharacteristic> getCachedCharacteristics() {
        return new ArrayList<>(characteristicMap.values());
    }

    public List<Characteristic> getCharacteristics() {
        ArrayList<Characteristic> result = new ArrayList<>();
        for (CachedCharacteristic cachedCharacteristic : characteristicMap.values()) {
            result.add(cachedCharacteristic.getCharacteristic());
        }

        return result;
    }
}
