package com.polidea.blemulator.containers;

import com.polidea.multiplatformbleadapter.Descriptor;
import com.polidea.multiplatformbleadapter.Device;
import com.polidea.multiplatformbleadapter.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DeviceContainer {
    private boolean isConnected;
    private Device device;
    private Map<String, CachedService> servicesByUuid = new HashMap<>();
    private Map<Integer, CachedService> servicesById = new HashMap<>();
    private Map<Integer, CachedCharacteristic> characteristicsById = new HashMap<>();
    private Map<Integer, Descriptor> descriptorsById = new HashMap<>();

    public DeviceContainer(Device device) {
        this.device = device;
    }

    public boolean isConnected() {
        return isConnected;
    }

    public void onConnectionEstablished() {
        isConnected = true;
    }

    public Device getDevice() {
        return device;
    }

    public CachedService getCachedService(String uuid) {
        return servicesByUuid.get(uuid.toLowerCase());
    }

    public CachedService getCachedService(Integer id) {
        return servicesById.get(id);
    }

    public List<Service> getServices() {
        ArrayList<Service> result = new ArrayList<>();

        for (CachedService service : servicesById.values()) {
            result.add(service.getService());
        }

        return result;
    }

    public CachedCharacteristic getCachedCharacteristic(Integer id) {
        return characteristicsById.get(id);
    }

    public Descriptor getDescriptor(Integer id) {
        return descriptorsById.get(id);
    }

    public boolean hasId(int id) {
        return servicesById.containsKey(id) || characteristicsById.containsKey(id) || descriptorsById.containsKey(id);
    }

    public void addGatts(List<CachedService> services) {
        for (CachedService service : services) {
            servicesByUuid.put(service.getService().getUuid().toString().toLowerCase(), service);
            servicesById.put(service.getService().getId(), service);
            for (CachedCharacteristic characteristic : service.getCachedCharacteristics()) {
                characteristicsById.put(characteristic.getCharacteristic().getId(), characteristic);
                for (Descriptor descriptor : characteristic.getDescriptors()) {
                    descriptorsById.put(descriptor.getId(), descriptor);
                }
            }
        }
    }

    public void clear() {
        servicesById.clear();
        servicesByUuid.clear();
        characteristicsById.clear();
        descriptorsById.clear();
        isConnected = false;
    }
}
