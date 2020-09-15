import { SimulatedPeripheral } from "../../.."
import { SimulatedBleError } from "../../ble-error"
import { AdapterState, UUID } from "../../types"
import { errorIfBluetoothNotOn, errorIfBluetoothNotSupported, errorIfScanInProgress } from "../error_creator"
import { ScanResultListener } from "../simulation-manager"
import { mapErrorToSimulatedBleError } from "../utils"

export class ScanDelegate {
    private addScanResult: ScanResultListener = () => { }
    private filteredUuids?: Array<UUID> = undefined
    private advertisementIntervalHandles: Array<number> = []
    private isScanInProgress: boolean = false
    private getAdapterState: () => AdapterState

    constructor(getAdapterState: () => AdapterState) {
        this.getAdapterState = getAdapterState
    }

    addPeripheral(peripheral: SimulatedPeripheral): void {
        if (this.isScanInProgress) {
            if (this.shouldAdvertise(peripheral, this.filteredUuids))
                this.setAdvertisement(peripheral)
        }
    }

    startScan(peripherals: Array<SimulatedPeripheral>, filteredUuids: Array<UUID> | undefined, scanMode: number | undefined,
        callbackType: number | undefined, addScanResult: ScanResultListener): SimulatedBleError | undefined {
        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfScanInProgress(this.isScanInProgress)

            this.addScanResult = addScanResult
            this.filteredUuids = filteredUuids?.map((uuid) => uuid.toUpperCase())
            peripherals.forEach((peripheral) => {
                if (this.shouldAdvertise(peripheral, this.filteredUuids))
                    this.setAdvertisement(peripheral)
            })
            this.isScanInProgress = true
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }

    stopScan(): void {
        while (this.advertisementIntervalHandles.length > 0) {
            const intervalHandle = this.advertisementIntervalHandles.pop()
            intervalHandle && clearInterval(intervalHandle)
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
                try {
                    errorIfBluetoothNotSupported(this.getAdapterState())
                    errorIfBluetoothNotOn(this.getAdapterState())
                    this.addScanResult(peripheral.getScanResult())
                } catch (error) {
                    const mappedError = mapErrorToSimulatedBleError(error)
                    this.stopScan()
                    this.addScanResult(null, mappedError)
                }
            },
            peripheral.advertisementInterval
        )
        this.advertisementIntervalHandles.push(handle)
    }
}
