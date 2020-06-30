import { AdapterState, UUID } from "../../types"
import { ScanResultListener } from "../simulation-manager"
import { SimulatedBleError } from "../../ble-error"
import { errorIfBluetoothNotOn, errorIfScanInProgress, errorIfBluetoothNotSupported } from "../error_creator"
import { SimulatedPeripheral } from "../../.."

export class ScanDelegate {
    private addScanResult: ScanResultListener = () => { }
    private filteredUuids?: Array<UUID> = undefined
    private advertisementIntervalHandles: Array<number> = []
    private isScanInProgress: boolean = false

    addPeripheral(peripheral: SimulatedPeripheral): void {
        if (this.isScanInProgress) {
            if (this.shouldAdvertise(peripheral, this.filteredUuids))
                this.setAdvertisement(peripheral)
        }
    }

    startScan(adapterState: AdapterState, peripherals: Array<SimulatedPeripheral>, filteredUuids: Array<UUID> | undefined, scanMode: number | undefined,
        callbackType: number | undefined, addScanResult: ScanResultListener): SimulatedBleError | undefined {
        try {
            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfScanInProgress(this.isScanInProgress)

            this.addScanResult = addScanResult
            this.filteredUuids = filteredUuids?.map((uuid) => uuid.toUpperCase())
            peripherals.forEach((peripheral) => {
                if (this.shouldAdvertise(peripheral, this.filteredUuids))
                    this.setAdvertisement(peripheral)
            })
            this.isScanInProgress = true
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                console.error(error)
            }

        }

    }

    stopScan(): void {
        while (this.advertisementIntervalHandles.length > 0) {
            clearInterval(this.advertisementIntervalHandles.pop())
        }
        this.addScanResult = () => { }
        this.isScanInProgress = false
    }

    private shouldAdvertise(peripheral: SimulatedPeripheral, filteredUuids?: Array<UUID>): boolean {
        let shouldAdvertise = true
        if (filteredUuids && filteredUuids.length > 0) {
            shouldAdvertise = filteredUuids.some(
                (value) => {
                    peripheral.scanInfo.serviceUuids.some(
                        (advertisedServiceUuid) => {
                            value === advertisedServiceUuid
                        })
                }
            )
        }
        return shouldAdvertise
    }

    private setAdvertisement(peripheral: SimulatedPeripheral): void {
        const handle = setInterval(
            () => {
                //TODO should check BT state and throw? or unregister if it's turned off
                this.addScanResult(peripheral.getScanResult())
            },
            peripheral.advertisementInterval
        )
        this.advertisementIntervalHandles.push(handle)
    }
}