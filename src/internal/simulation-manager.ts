import { ScanResult } from '../scan-result'
import { SimulatedPeripheral } from '../simulated-peripheral'
import { UUID, AdapterState, ConnectionState, Base64 } from '../types'
import { SimulatedBleError } from '../ble-error'
import { ConnectionDelegate } from './delegates/connection-delegate'
import { ScanDelegate } from './delegates/scan-delegate'
import { AdapterStateDelegate, AdapterStateChangeListener } from './delegates/adapter-state-delegate'
import { SimulatedService } from '../simulated-service'
import { DiscoveryDelegate } from './delegates/discovery-delegate'
import { CharacteristicsDelegate } from './delegates/characteristics-delegate'
import { TransferCharacteristic, TransferDescriptor } from './internal-types'
import { MtuDelegate } from './delegates/mtu-delegate'
import { DescriptorsDelegate } from './delegates/descriptors-delegate'
import { mapErrorToSimulatedBleError } from './utils'
import { errorIfBluetoothNotSupported, errorIfBluetoothNotOn, errorIfNotConnected, errorIfUnknown } from './error_creator'

export type ScanResultListener = (scanResult: ScanResult | null, error?: SimulatedBleError) => void

export class SimulationManager {
    private peripherals: Array<SimulatedPeripheral> = []
    private peripheralsById: Map<string, SimulatedPeripheral> = new Map<string, SimulatedPeripheral>()
    private adapterStateDelegate: AdapterStateDelegate = new AdapterStateDelegate()
    private scanDelegate: ScanDelegate = new ScanDelegate(() => this.getAdapterState())
    private connectionDelegate: ConnectionDelegate = new ConnectionDelegate(() => this.getAdapterState())
    private discoveryDelegate: DiscoveryDelegate = new DiscoveryDelegate(() => this.getAdapterState())
    private characteristicsDelegate: CharacteristicsDelegate = new CharacteristicsDelegate(() => this.getAdapterState())
    private descriptorsDelegate: DescriptorsDelegate = new DescriptorsDelegate(() => this.getAdapterState())
    private mtuDelegate: MtuDelegate = new MtuDelegate(() => this.getAdapterState())

    clearState() {
        this.peripherals.forEach((peripheral) => peripheral.onDisconnect())
    }

    setConnectionStatePublisher(publisher: (id: string, state: ConnectionState, error?: SimulatedBleError) => (void)) {
        this.connectionDelegate.setConnectionStatePublisher(publisher)
    }

    setNotificationPublisher(
        publisher: (
            transactionId: string,
            characteristic: TransferCharacteristic | null,
            error?: SimulatedBleError
        ) => void
    ) {
        this.characteristicsDelegate.setNotificationPublisher(publisher)
    }

    setAdapterState(adapterState: AdapterState) {
        this.adapterStateDelegate.setAdapterState(adapterState)
    }

    getAdapterState(): AdapterState {
        return this.adapterStateDelegate.getAdapterState()
    }

    setAdapterStatePublisher(publisher?: AdapterStateChangeListener) {
        const listener: AdapterStateChangeListener = (newState: AdapterState) => {
            if (publisher) {
                publisher(newState)
            }
            this.characteristicsDelegate.onAdapterStateChanged(newState)
            this.connectionDelegate.onAdapterStateChanged(newState, this.peripheralsById)
        }
        this.adapterStateDelegate.setAdapterStateChangeListener(listener)
    }

    setAdapterStateChangeDelay(delay?: number) {
        this.adapterStateDelegate.setAdapterStateChangeDelay(delay)
    }

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.peripherals.push(peripheral)
        this.peripheralsById.set(peripheral.id, peripheral)
        this.scanDelegate.addPeripheral(peripheral)
    }

    startScan(filteredUuids: Array<UUID> | undefined, scanMode: number | undefined,
        callbackType: number | undefined, addScanResult: ScanResultListener
    ): SimulatedBleError | undefined {
        return this.scanDelegate.startScan(
            this.peripherals, filteredUuids, scanMode, callbackType, addScanResult)
    }

    stopScan(): void {
        return this.scanDelegate.stopScan()
    }

    getKnownDevices(peripheralIds: Array<string>): Array<SimulatedPeripheral> {
        const result: Array<SimulatedPeripheral> = new Array()
        peripheralIds.forEach((id) => {
            if (this.peripheralsById.has(id)) {
                result.push(this.peripheralsById.get(id)!)
            }
        })
        return result
    }

    getConnectedDevices(serviceUuids: Array<UUID>): Array<SimulatedPeripheral> {
        const result: Map<string, SimulatedPeripheral> = new Map()
        this.peripherals.forEach((peripheral) => {
            serviceUuids.forEach((serviceUuid) => {
                if (peripheral.getServiceByUuid(serviceUuid) != null && peripheral.isConnected()) {
                    result.set(peripheral.id, peripheral)
                }
            })
        })

        return Array.from(result.values())
    }

    async connect(peripheralIdentifier: string, requestMtu?: number): Promise<SimulatedBleError | SimulatedPeripheral> {
        return this.connectionDelegate.connect(
            this.peripheralsById, peripheralIdentifier, requestMtu)
    }

    async disconnect(peripheralIdentifier: string): Promise<SimulatedBleError | undefined> {
        return this.connectionDelegate.disconnect(
            this.peripheralsById, peripheralIdentifier)
    }

    async isDeviceConnected(peripheralIdentifier: string): Promise<SimulatedBleError | boolean> {
        return this.connectionDelegate.isConnected(
            this.peripheralsById,
            peripheralIdentifier
        );
    }

    async readRssi(peripheralIdentifier: string, transactionId: string): Promise<SimulatedBleError | SimulatedPeripheral> {
        try {
            errorIfBluetoothNotSupported(this.adapterStateDelegate.getAdapterState())
            errorIfBluetoothNotOn(this.adapterStateDelegate.getAdapterState())
            errorIfUnknown(this.peripheralsById, peripheralIdentifier)
            errorIfNotConnected(this.peripheralsById, peripheralIdentifier)
            return this.peripheralsById.get(peripheralIdentifier)!
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }

    async requestConnectionPriority(peripheralId: string,
        connectionPriority: number,
        transactionId: string
    ): Promise<SimulatedBleError | SimulatedPeripheral> {
        return this.connectionDelegate.requestConnectionPriority(
            this.peripheralsById,
            peripheralId,
            connectionPriority,
            transactionId
        )
    }

    async enable(): Promise<SimulatedBleError | undefined> {
        let result = this.adapterStateDelegate.enable()
        return result;
    }

    async disable(): Promise<SimulatedBleError | undefined> {
        let result = this.adapterStateDelegate.disable()
        return result
    }

    async requestMtu(peripheralIdentifier: string, mtu: number): Promise<SimulatedBleError | number> {
        return this.mtuDelegate.requestMtu(
            this.peripheralsById,
            peripheralIdentifier,
            mtu
        )
    }

    async discovery(peripheralIdentifier: string): Promise<SimulatedBleError | Array<SimulatedService>> {
        return this.discoveryDelegate.discovery(
            this.peripheralsById, peripheralIdentifier
        )
    }

    async readCharacteristic(characteristicId: number): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.readCharacteristic(
            this.peripherals,
            characteristicId
        )
    }

    async readCharacteristicForService(serviceId: number,
        characteristicUuid: UUID
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.readCharacteristicForService(
            this.peripherals,
            serviceId,
            characteristicUuid
        )
    }

    async readCharacteristicForDevice(peripheralId: string,
        serviceUuid: UUID, characteristicUuid: UUID
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.readCharacteristicForDevice(
            this.peripheralsById,
            peripheralId,
            serviceUuid,
            characteristicUuid
        )
    }

    async writeCharacteristic(characteristicId: number,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.writeCharacteristic(
            this.peripherals,
            characteristicId,
            value,
            withResponse,
            transactionId
        )
    }

    async writeCharacteristicForService(serviceId: number,
        characteristicUuid: UUID,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.writeCharacteristicForService(
            this.peripherals,
            serviceId,
            characteristicUuid,
            value,
            withResponse,
            transactionId
        )
    }

    async writeCharacteristicForDevice(
        peripheralId: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.writeCharacteristicForDevice(
            this.peripheralsById,
            peripheralId,
            serviceUuid,
            characteristicUuid,
            value,
            withResponse,
            transactionId
        )
    }

    monitorCharacteristic(characteristicId: number, transactionId: string): void {
        this.characteristicsDelegate.monitorCharacteristic(
            this.peripherals, characteristicId, transactionId);
    }

    monitorCharacteristicForService(serviceId: number, characteristicUuid: UUID, transactionId: string): void {
        this.characteristicsDelegate.monitorCharacteristicForService(
            this.peripherals, serviceId, characteristicUuid, transactionId)
    }

    monitorCharacteristicForDevice(peripheralId: string,
        serviceUuid: UUID, characteristicUuid: UUID, transactionId: string
    ): void {
        this.characteristicsDelegate.monitorCharacteristicForDevice(
            this.peripheralsById, peripheralId, serviceUuid, characteristicUuid, transactionId)
    }

    async readDescriptor(
        descriptorId: number,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.readDescriptor(this.peripherals, descriptorId, transactionId)
    }

    async readDescriptorForCharacteristic(
        characteristicId: number,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.readDescriptorForCharacteristic(
            this.peripherals, characteristicId, descriptorUuid, transactionId
        )
    }

    async readDescriptorForService(
        serviceId: number,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.readDescriptorForService(
            this.peripherals, serviceId, characteristicUuid, descriptorUuid, transactionId
        )
    }

    async readDescriptorForDevice(
        peripheralId: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.readDescriptorForDevice(
            this.peripheralsById, peripheralId, serviceUuid, characteristicUuid, descriptorUuid, transactionId
        )
    }

    async writeDescriptorForDevice(
        peripheralId: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.writeDescriptorForDevice(
            this.peripheralsById,
            peripheralId,
            serviceUuid,
            characteristicUuid,
            descriptorUuid,
            value,
            transactionId
        )
    }

    async writeDescriptorForService(
        serviceId: number,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.writeDescriptorForService(
            this.peripherals,
            serviceId,
            characteristicUuid,
            descriptorUuid,
            value,
            transactionId
        )
    }

    async writeDescriptorForCharacteristic(
        characteristicId: number,
        descriptorUuid: UUID,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.writeDescriptorForCharacteristic(
            this.peripherals,
            characteristicId,
            descriptorUuid,
            value,
            transactionId
        )
    }

    async writeDescriptor(
        descriptorId: number,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        return this.descriptorsDelegate.writeDescriptor(
            this.peripherals,
            descriptorId,
            value,
            transactionId
        )
    }
}
