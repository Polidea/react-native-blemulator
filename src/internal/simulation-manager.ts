import { ScanResult } from '../scan-result'
import { SimulatedPeripheral } from '../simulated-peripheral'
import { UUID } from '../types'
import { SimulatedBleError, BleErrorCode } from '../ble-error'

export type ScanResultListener = (scanResult: ScanResult) => void

enum AdapterState {
    BLUETOOTH_ON
}

export class SimulationManager {
    private adapterState: AdapterState = AdapterState.BLUETOOTH_ON
    private peripherals: Array<SimulatedPeripheral> = []
    private addScanResult: ScanResultListener = () => { }
    private filteredUuids?: Array<UUID> = undefined
    private advertisementIntervalHandles: Array<number> = []
    private isScanInProgress: boolean = false

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.peripherals.push(peripheral)
        if (this.isScanInProgress) {
            if (this.shouldAdvertise(peripheral, this.filteredUuids))
                this.setAdvertisement(peripheral)
            this.setAdvertisement(peripheral)
        }
    }

    startScan(filteredUuids: Array<UUID> | undefined, scanMode: number | undefined,
        callbackType: number | undefined, addScanResult: ScanResultListener): SimulatedBleError | undefined {
        if (this.adapterState != AdapterState.BLUETOOTH_ON) {
            return {
                errorCode: BleErrorCode.BluetoothPoweredOff,
                message: "Bluetooth not powered on"
            }
        }
        if (this.isScanInProgress) {
            return {
                errorCode: BleErrorCode.ScanStartFailed,
                message: "Scan already in progress" //TODO should this error be returned?
            }
        }

        this.addScanResult = addScanResult
        this.filteredUuids = filteredUuids
        this.peripherals.forEach((peripheral) => {
            if (this.shouldAdvertise(peripheral, this.filteredUuids))
                this.setAdvertisement(peripheral)
        })
        this.isScanInProgress = true

        return undefined
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
                this.addScanResult(peripheral.getScanResult())
            },
            peripheral.advertisementInterval
        )
        this.advertisementIntervalHandles.push(handle)
    }
}