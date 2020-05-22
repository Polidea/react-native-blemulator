import { ScanResult } from './scan-result'

export type ScanResultListener = (scanResult: ScanResult) => void

export class SimulationManager {
    private addScanResult: ScanResultListener = () => {}
    private intervalHandles: Array<number> = []

    startScan(addScanResult: ScanResultListener) {
        this.addScanResult = addScanResult
        this.scanningStub()
    }

    stopScan() {
        while (this.intervalHandles.length > 0) {
            clearInterval(this.intervalHandles.pop())
        }
    }

    private scanningStub() {
        const advertisementIntervalMs = 500;
        
        const handle = setInterval(() => { 
            this.addScanResult(new ScanResult())
         },
         advertisementIntervalMs)

         this.intervalHandles.push(handle)
    }
}