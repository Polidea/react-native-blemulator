import { Base64, UUID, ConnectionState, ConnectionStateListener, Subscription } from "./types";
import { SimulatedService } from "./simulated-service";
import { SimulatedCharacteristic } from "./simulated-characteristic";
import { SimulatedDescriptor } from "./simulated-descriptor";
import { ScanResult } from "./scan-result";
import { IdGenerator } from "./internal/utils";
import { Platform } from 'react-native';
import { DEFAULT_MTU, MIN_MTU, MAX_MTU } from "./internal/delegates/mtu-delegate"

export interface ScanInfo {
    rssi: number
    txPowerLevel?: number

    localName?: string
    isConnectable: boolean

    manufacturerData?: Base64
    serviceData?: Map<UUID, Base64>
    serviceUuids: Array<UUID>
    solicitedServiceUuids?: Array<UUID>
    overflowUuids?: Array<UUID>
}

export class SimulatedPeripheral {
    readonly name?: string
    readonly id: string
    advertisementInterval: number
    readonly scanInfo: ScanInfo
    mtu: number = DEFAULT_MTU
    private servicesById: Map<number, SimulatedService> = new Map<number, SimulatedService>()
    private servicesByUuid: Map<UUID, SimulatedService> = new Map<UUID, SimulatedService>()
    private characteristicsById: Map<number, SimulatedCharacteristic> = new Map<number, SimulatedCharacteristic>()
    private descriptorsById: Map<number, SimulatedDescriptor> = new Map<number, SimulatedDescriptor>()
    private _isConnected: boolean = false
    private _isDiscoveryDone: boolean = false
    private connectionStateListeners: Map<number, ConnectionStateListener> = new Map()
    private _isMtuNegotiated: boolean = false

    constructor({
        name, id, advertisementInterval, services, rssi = -30, txPowerLevel, isConnectable = true,
        manufacturerData, serviceData, serviceUuids = [], localName, solicitedServiceUuids, overflowUuids
    }: { name?: string, id: string, advertisementInterval: number, services: Array<SimulatedService> } & ScanInfo) {
        this.scanInfo = {
            rssi, txPowerLevel, isConnectable, manufacturerData, serviceUuids, serviceData, solicitedServiceUuids, overflowUuids, localName
        }
        this.name = name
        this.id = id
        this.advertisementInterval = advertisementInterval

        services.forEach((service) => {
            this.servicesById.set(service.id, service)
            this.servicesByUuid.set(service.uuid, service)

            service.getCharacteristics().forEach((characteristic) => {
                this.characteristicsById.set(characteristic.id, characteristic)

                characteristic.getDescriptors().forEach((descriptor) => {
                    this.descriptorsById.set(descriptor.id, descriptor)
                })
            })

            if (service.isAdvertised) {
                this.scanInfo.serviceUuids.push(service.uuid)
            }
        })
    }

    getScanResult(): ScanResult {
        return new ScanResult({
            name: this.name, id: this.id, rssi: this.scanInfo.rssi,
            txPowerLevel: this.scanInfo.txPowerLevel, isConnectable: this.scanInfo.isConnectable,
            manufacturerData: this.scanInfo.manufacturerData, serviceData: this.scanInfo.serviceData,
            serviceUuids: this.scanInfo.serviceUuids, solicitedServiceUuids: this.scanInfo.solicitedServiceUuids,
            localName: this.scanInfo.localName, overflowServiceUuids: this.scanInfo.overflowUuids,
        })
    }

    async onConnectRequest(): Promise<boolean> {
        this.onConnectionStateChanged(ConnectionState.CONNECTING)
        return true
    }

    async onConnect(): Promise<void> {
        this._isConnected = true
        this.onConnectionStateChanged(ConnectionState.CONNECTED)
    }

    async onDisconnect(args?: { emit?: boolean }): Promise<void> {
        this._isConnected = false
        this._isDiscoveryDone = false
        if (args?.emit) {
            this.onConnectionStateChanged(ConnectionState.DISCONNECTED)
        }
        this.mtu = DEFAULT_MTU
        this._isMtuNegotiated = false
        this.characteristicsById.forEach((characteristic) => characteristic.onDisconnect())
    }

    async onDiscovery(): Promise<void> {
        this._isDiscoveryDone = true
    }

    async onRequestMtu(requestedMtu: number ): Promise<number> {
        if (Platform.OS === "android") {
            this.mtu = this.negotiateMtu(requestedMtu);
        }
        this._isMtuNegotiated = true
        return this.mtu;
    }

    getMtu(): number {
        return this.mtu
    }

    private negotiateMtu(requestedMtu: number): number {
        let negotiatedMtu: number = Math.max(MIN_MTU, requestedMtu);
        negotiatedMtu = Math.min(MAX_MTU, negotiatedMtu);
        return negotiatedMtu;
      }

    listenToConnectionStateChanges(listener: ConnectionStateListener): Subscription {
        let id = IdGenerator.nextId()
        this.connectionStateListeners.set(id, listener)

        const that = this
        return {
            dispose() {
                that.connectionStateListeners.delete(id)
            }
        }
    }

    isConnected(): boolean {
        return this._isConnected
    }

    isDiscoveryDone(): boolean {
        return this._isDiscoveryDone;
    }

    getServices(): Array<SimulatedService> {
        return Array.from(this.servicesByUuid.values())
    }

    isMtuNegotiated(): boolean {
        return this._isMtuNegotiated
    }

    getService(id: number): SimulatedService | undefined {
        return this.servicesById.get(id)
    }

    getCharacteristic(id: number): SimulatedCharacteristic | undefined {
        return this.characteristicsById.get(id)
    }

    getDescriptor(id: number): SimulatedDescriptor | undefined {
        return this.descriptorsById.get(id)
    }

    getCharacteristicForService(serviceUuid: UUID, characteristicUuid: UUID): SimulatedCharacteristic | undefined {
        let service = this.servicesByUuid.get(serviceUuid.toUpperCase())
        if (!service) {
            return undefined
        }

        return service.getCharacteristicByUuid(characteristicUuid.toUpperCase())
    }

    getDescriptorForCharacteristicAndService(serviceUuid: UUID, characteristicUuid: UUID, descriptorUuid: UUID): SimulatedDescriptor | undefined {
        let characteristic = this.getCharacteristicForService(serviceUuid.toUpperCase(), characteristicUuid.toUpperCase())
        if (!characteristic) {
            return undefined
        }

        return characteristic.getDescriptorByUuid(descriptorUuid.toUpperCase())
    }

    getDescriptorForCharacteristic(characteristicId: number, descriptorUuid: UUID): SimulatedDescriptor | undefined {
        let characteristic = this.characteristicsById.get(characteristicId)
        if (!characteristic) {
            return undefined
        }

        return characteristic.getDescriptorByUuid(descriptorUuid.toUpperCase())
    }

    getDescriptorForService(serviceId: number, characteristicUuid: UUID, descriptorUuid: UUID): SimulatedDescriptor | undefined {
        let service = this.servicesById.get(serviceId)
        if (!service) {
            return undefined
        }

        let characteristic = service.getCharacteristicByUuid(characteristicUuid.toUpperCase())
        if (!characteristic) {
            return undefined
        }

        return characteristic.getDescriptorByUuid(descriptorUuid.toUpperCase())
    }

    private onConnectionStateChanged(newConnectionState: ConnectionState): void {
        console.log(`P:id "${this.id}"; state: ${newConnectionState}`) //TODO should this somehow be exposed to user? Maybe switched on or off somehow?
        this.connectionStateListeners.forEach((listener) => listener(newConnectionState))
    }
}