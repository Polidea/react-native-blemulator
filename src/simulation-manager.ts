import { ScanResult } from './scan-result'
import { SimulatedPeripheral } from './simulated-peripheral'

export type ScanResultListener = (scanResult: ScanResult) => void

export class SimulationManager {
    private peripherals: Array<SimulatedPeripheral> = []
    private addScanResult: ScanResultListener = () => { }
    private advertisementIntervalHandles: Array<number> = []

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.peripherals.push(peripheral)
    }

    startScan(addScanResult: ScanResultListener) {
        this.addScanResult = addScanResult
        this.scanningStub()
    }

    stopScan() {
        while (this.advertisementIntervalHandles.length > 0) {
            clearInterval(this.advertisementIntervalHandles.pop())
        }
    }

    private scanningStub() {
        const advertisementIntervalMs = 500;

        const handle = setInterval(
            () => {
                this.addScanResult(new ScanResult(
                    { 
                        id: "test id",
                        localName: "SensorTag",
                        name: "SensorTag",
                        rssi: -50
                    }
                ))
            },
            advertisementIntervalMs,
        )

        this.advertisementIntervalHandles.push(handle)
    }
}