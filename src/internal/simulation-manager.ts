import { ScanResult } from '../scan-result'
import { SimulatedPeripheral } from '../simulated-peripheral'
import { UUID, AdapterState, ConnectionState } from '../types'
import { SimulatedBleError } from '../ble-error'
import { ConnectionDelegate } from './delegates/connection-delegate'
import { ScanDelegate } from './delegates/scan-delegate'
import { AdapterStateDelegate, AdapterStateChangeListener } from './delegates/adapter-state-delegate'

export type ScanResultListener = (scanResult: ScanResult) => void

export class SimulationManager {
    private peripherals: Array<SimulatedPeripheral> = []
    private peripheralsById: Map<string, SimulatedPeripheral> = new Map<string, SimulatedPeripheral>()
    private scanDelegate: ScanDelegate = new ScanDelegate()
    private connectionDelegate: ConnectionDelegate = new ConnectionDelegate()
    private adapterStateDelegate: AdapterStateDelegate = new AdapterStateDelegate()

    setConnectionStatePublisher(publisher: (id: string, state: ConnectionState) => (void)) {
        this.connectionDelegate.setConnectionStatePublisher(publisher)
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

    async connect(peripheralIdentifier: string): Promise<SimulatedBleError | undefined> {
        return this.connectionDelegate.connect(this.adapterStateDelegate.getAdapterState(),
            this.peripheralsById, peripheralIdentifier)
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
}