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
import { errorIfBluetoothNotSupported, errorIfBluetoothNotOn, errorIfNotConnected, errorIfUnknown, errorIfOperationCancelled } from './error_creator'
import { TransactionMonitor } from './transaction-monitor'

export type ScanResultListener = (scanResult: ScanResult | null, error?: SimulatedBleError) => void

export class SimulationManager {
    private peripherals: Array<SimulatedPeripheral> = []
    private peripheralsById: Map<string, SimulatedPeripheral> = new Map<string, SimulatedPeripheral>()
    private transactionMonitor: TransactionMonitor = new TransactionMonitor()
    private adapterStateDelegate: AdapterStateDelegate = new AdapterStateDelegate(this.transactionMonitor)
    private scanDelegate: ScanDelegate = new ScanDelegate(() => this.getAdapterState())
    private connectionDelegate: ConnectionDelegate = new ConnectionDelegate(() => this.getAdapterState(), this.transactionMonitor)
    private discoveryDelegate: DiscoveryDelegate = new DiscoveryDelegate(() => this.getAdapterState(), this.transactionMonitor)
    private characteristicsDelegate: CharacteristicsDelegate = new CharacteristicsDelegate(() => this.getAdapterState(), this.transactionMonitor)
    private descriptorsDelegate: DescriptorsDelegate = new DescriptorsDelegate(() => this.getAdapterState(), this.transactionMonitor)
    private mtuDelegate: MtuDelegate = new MtuDelegate(() => this.getAdapterState(), this.transactionMonitor)

    clearState() {
        this.peripherals.forEach((peripheral) => peripheral.onDisconnect())
        this.transactionMonitor.clearAllTransactions()
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
        const internalTransactionId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            errorIfBluetoothNotSupported(this.adapterStateDelegate.getAdapterState())
            errorIfBluetoothNotOn(this.adapterStateDelegate.getAdapterState())
            errorIfUnknown(this.peripheralsById, peripheralIdentifier)
            errorIfNotConnected(this.peripheralsById, peripheralIdentifier)
            errorIfOperationCancelled(transactionId, internalTransactionId, this.transactionMonitor)

            return this.peripheralsById.get(peripheralIdentifier)!
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalTransactionId)
        }
    }

    async requestConnectionPriority(peripheralId: string,
        connectionPriority: number,
        transactionId: string
    ): Promise<SimulatedBleError | SimulatedPeripheral> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.connectionDelegate.requestConnectionPriority(
            this.peripheralsById,
            peripheralId,
            connectionPriority,
            transactionId
        )
    }

    async enable(transactionId: string): Promise<SimulatedBleError | undefined> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        let result = this.adapterStateDelegate.enable(transactionId)
        return result;
    }

    async disable(transactionId: string): Promise<SimulatedBleError | undefined> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        let result = this.adapterStateDelegate.disable(transactionId)
        return result
    }

    async requestMtu(peripheralIdentifier: string, mtu: number, transactionId: string): Promise<SimulatedBleError | number> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.mtuDelegate.requestMtu(
            this.peripheralsById,
            peripheralIdentifier,
            mtu,
            transactionId
        )
    }

    async discovery(peripheralIdentifier: string, transactionId: string): Promise<SimulatedBleError | Array<SimulatedService>> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.discoveryDelegate.discovery(
            this.peripheralsById, peripheralIdentifier, transactionId
        )
    }

    async readCharacteristic(characteristicId: number, transactionId: string): Promise<TransferCharacteristic | SimulatedBleError> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.characteristicsDelegate.readCharacteristic(
            this.peripherals,
            characteristicId,
            transactionId
        )
    }

    async readCharacteristicForService(serviceId: number,
        characteristicUuid: UUID,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.characteristicsDelegate.readCharacteristicForService(
            this.peripherals,
            serviceId,
            characteristicUuid,
            transactionId
        )
    }

    async readCharacteristicForDevice(peripheralId: string,
        serviceUuid: UUID, characteristicUuid: UUID,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.characteristicsDelegate.readCharacteristicForDevice(
            this.peripheralsById,
            peripheralId,
            serviceUuid,
            characteristicUuid,
            transactionId
        )
    }

    async writeCharacteristic(characteristicId: number,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.descriptorsDelegate.readDescriptor(this.peripherals, descriptorId, transactionId)
    }

    async readDescriptorForCharacteristic(
        characteristicId: number,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
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
        this.characteristicsDelegate.onNewTransaction(transactionId)
        return this.descriptorsDelegate.writeDescriptor(
            this.peripherals,
            descriptorId,
            value,
            transactionId
        )
    }

    cancelTransaction(transactionId: string) {
        this.transactionMonitor.cancelTransaction(transactionId)
    }
}
