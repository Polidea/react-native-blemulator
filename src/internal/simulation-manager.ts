import { ScanResult } from '../scan-result'
import { SimulatedPeripheral } from '../simulated-peripheral'
import { UUID, AdapterState, ConnectionState } from '../types'
import { SimulatedBleError } from '../ble-error'
import { ConnectionDelegate } from './delegates/connection-delegate'
import { ScanDelegate } from './delegates/scan-delegate'
import { AdapterStateDelegate, AdapterStateChangeListener } from './delegates/adapter-state-delegate'
import { SimulatedService } from '../simulated-service'
import { DiscoveryDelegate } from './delegates/discovery-delegate'
import { CharacteristicsDelegate } from './delegates/characteristics-delegate'
import { TransferCharacteristic } from './internal-types'
import { MtuDelegate } from './delegates/mtu-delegate'

export type ScanResultListener = (scanResult: ScanResult) => void

export class SimulationManager {
    private peripherals: Array<SimulatedPeripheral> = []
    private peripheralsById: Map<string, SimulatedPeripheral> = new Map<string, SimulatedPeripheral>()
    private scanDelegate: ScanDelegate = new ScanDelegate()
    private connectionDelegate: ConnectionDelegate = new ConnectionDelegate()
    private adapterStateDelegate: AdapterStateDelegate = new AdapterStateDelegate()
    private discoveryDelegate: DiscoveryDelegate = new DiscoveryDelegate()
    private characteristicsDelegate: CharacteristicsDelegate = new CharacteristicsDelegate()
    private mtuDelegate: MtuDelegate = new MtuDelegate()
    private ongoingTransactions: Map<string, boolean> = new Map(); //TODO pass to delegates

    setConnectionStatePublisher(publisher: (id: string, state: ConnectionState) => (void)) {
        this.connectionDelegate.setConnectionStatePublisher(publisher)
    }

    setNotificationPublisher(publisher: (transactionId: string, characteristic: TransferCharacteristic | null, error?: SimulatedBleError) => void) {
        this.characteristicsDelegate.setNotificationPublisher(publisher)
    }

    setAdapterState(adapterState: AdapterState) {
        this.adapterStateDelegate.setAdapterState(adapterState)
    }

    getAdapterState(): AdapterState {
        return this.adapterStateDelegate.getAdapterState()
    }

    setAdapterStatePublisher(publisher?: AdapterStateChangeListener) {
        this.adapterStateDelegate.setAdapterStateChangeListener(publisher)
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
        callbackType: number | undefined, addScanResult: ScanResultListener): SimulatedBleError | undefined {
        return this.scanDelegate.startScan(this.adapterStateDelegate.getAdapterState(),
            this.peripherals, filteredUuids, scanMode, callbackType, addScanResult)
    }

    stopScan(): void {
        return this.scanDelegate.stopScan()
    }

    async connect(peripheralIdentifier: string, requestMtu?: number): Promise<SimulatedBleError | undefined> {
        return this.connectionDelegate.connect(this.adapterStateDelegate.getAdapterState(),
            this.peripheralsById, peripheralIdentifier, requestMtu)
    }

    async disconnect(peripheralIdentifier: string): Promise<SimulatedBleError | undefined> {
        return this.connectionDelegate.disconnect(this.adapterStateDelegate.getAdapterState(),
            this.peripheralsById, peripheralIdentifier)
    }

    async isDeviceConnected(peripheralIdentifier: string): Promise<SimulatedBleError | boolean> {
        return this.connectionDelegate.isConnected(this.adapterStateDelegate.getAdapterState(), this.peripheralsById, peripheralIdentifier);
    }

    async enable(): Promise<SimulatedBleError | undefined> {
        return this.adapterStateDelegate.enable()
    }

    async disable(): Promise<SimulatedBleError | undefined> {
        return this.adapterStateDelegate.disable()
    }

    async discovery(peripheralIdentifier: string): Promise<SimulatedBleError | Array<SimulatedService>> {
        return this.discoveryDelegate.discovery(this.adapterStateDelegate.getAdapterState(), this.peripheralsById, peripheralIdentifier)
    }

    async readCharacteristic(characteristicId: number): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.readCharacteristic(
            this.adapterStateDelegate.getAdapterState(),
            this.peripherals,
            characteristicId
        )
    }

    async readCharacteristicForService(serviceId: number, characteristicUuid: UUID): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.readCharacteristicForService(
            this.adapterStateDelegate.getAdapterState(),
            this.peripherals,
            serviceId,
            characteristicUuid
        )
    }

    async readCharacteristicForDevice(peripheralId: string, serviceUuid: UUID, characteristicUuid: UUID): Promise<TransferCharacteristic | SimulatedBleError> {
        return this.characteristicsDelegate.readCharacteristicForDevice(
            this.adapterStateDelegate.getAdapterState(),
            this.peripheralsById,
            peripheralId,
            serviceUuid,
            characteristicUuid
        )
    }
    
    async requestMtu(peripheralIdentifier: string, mtu: number): Promise<SimulatedBleError | number> {
        return this.mtuDelegate.requestMtu(this.adapterStateDelegate.getAdapterState(), this.peripheralsById, peripheralIdentifier, mtu)
    }

    monitorCharacteristic(characteristicId: number, transactionId: string): void {
        this.characteristicsDelegate.monitorCharacteristic(this.adapterStateDelegate.getAdapterState(),
            this.peripherals, characteristicId, transactionId);
    }

    monitorCharacteristicForService(serviceId: number, characteristicUuid: UUID, transactionId: string): void {
        this.characteristicsDelegate.monitorCharacteristicForService(this.adapterStateDelegate.getAdapterState(),
            this.peripherals, serviceId, characteristicUuid, transactionId)
    }

    monitorCharacteristicForDevice(peripheralId: string,
        serviceUuid: UUID, characteristicUuid: UUID, transactionId: string): void {
        this.characteristicsDelegate.monitorCharacteristicForDevice(this.adapterStateDelegate.getAdapterState(),
            this.peripheralsById, peripheralId, serviceUuid, characteristicUuid, transactionId)
    }
}
