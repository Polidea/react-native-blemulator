import { ScanResult } from '../scan-result'
import { SimulatedPeripheral } from '../simulated-peripheral'

export type ScanResultListener = (scanResult: ScanResult) => void

export class SimulationManager {
    private peripherals: Array<SimulatedPeripheral> = []
    private addScanResult: ScanResultListener = () => { }
    private advertisementIntervalHandles: Array<number> = []
    private isScanInProgress: boolean = false

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.peripherals.push(peripheral)
        if (this.isScanInProgress) {
            this.setAdvertisement(peripheral)
        }
    }

    startScan(addScanResult: ScanResultListener): void {
        this.addScanResult = addScanResult
        this.peripherals.forEach((peripheral) => {
            this.setAdvertisement(peripheral)
        })
        this.isScanInProgress = true
    }

    stopScan(): void {
        while (this.advertisementIntervalHandles.length > 0) {
            clearInterval(this.advertisementIntervalHandles.pop())
        }
        this.addScanResult = () => { }
        this.isScanInProgress = false
    }

    private setAdvertisement(peripheral: SimulatedPeripheral): void {
        const handle = setInterval(
            () => {
                this.addScanResult(peripheral.getScanResult())
            },
            peripheral.advertisementInterval
        )
        this.advertisementIntervalHandles.push(handle)
    }
}