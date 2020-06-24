import { ScanResult } from '../scan-result'
import { SimulatedPeripheral } from '../simulated-peripheral'
import { UUID, AdapterState, ConnectionState } from '../types'
import { SimulatedBleError } from '../ble-error'
import { ConnectionDelegate } from './delegates/connection-delegate'
import { ScanDelegate } from './delegates/scan-delegate'

export type ScanResultListener = (scanResult: ScanResult) => void

export class SimulationManager {
    private adapterState: AdapterState = AdapterState.POWERED_ON
    private peripherals: Array<SimulatedPeripheral> = []
    private peripheralsById: Map<string, SimulatedPeripheral> = new Map<string, SimulatedPeripheral>()
    private scanDelegate: ScanDelegate = new ScanDelegate()
    private connectionDelegate: ConnectionDelegate = new ConnectionDelegate()

    setConnectionStatePublisher(publisher: (id: string, state: ConnectionState) => (void)) {
        this.connectionDelegate.setConnectionStatePublisher(publisher)
    }

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.peripherals.push(peripheral)
        this.peripheralsById.set(peripheral.id, peripheral)
        this.scanDelegate.addPeripheral(peripheral)
    }

    startScan(filteredUuids: Array<UUID> | undefined, scanMode: number | undefined,
        callbackType: number | undefined, addScanResult: ScanResultListener): SimulatedBleError | undefined {
        return this.scanDelegate.startScan(this.peripherals, filteredUuids, scanMode, callbackType, addScanResult)
    }

    stopScan(): void {
        return this.scanDelegate.stopScan()
    }

    async connect(peripheralIdentifier: string): Promise<SimulatedBleError | undefined> {
        return this.connectionDelegate.connect(this.adapterState, this.peripheralsById, peripheralIdentifier)
    }

    async disconnect(peripheralIdentifier: string): Promise<SimulatedBleError | undefined> {
        return this.connectionDelegate.disconnect(this.adapterState, this.peripheralsById, peripheralIdentifier)
    }
}