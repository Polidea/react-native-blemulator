import { SimulatedPeripheral } from "../simulated-peripheral";
import { SimulatedBleError, BleErrorCode } from "../ble-error";
import { AdapterState } from "../types";

export function errorIfScanInProgress(isScanInProgress: boolean): void {
    if (isScanInProgress) {
        throw new SimulatedBleError({
            errorCode: BleErrorCode.ScanStartFailed,
            message: "Scan is already in progress"
        })
    }
}

export function errorIfBluetoothNotOn(adapterState: AdapterState): void {
    if (adapterState !== AdapterState.POWERED_ON) {
        throw new SimulatedBleError({
            errorCode: BleErrorCode.BluetoothPoweredOff,
            message: "Bluetooth adapter is not powered on"
        })
    }
}

export function errorIfUnknown(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (!peripheralsById.has(peripheralIdentifier)) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceNotFound,
            message: `Peripheral with identifier ${peripheralIdentifier} is unknown`
        })
        throw error
    }
}

export function errorIfConnected(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (peripheralsById.get(peripheralIdentifier)?.isConnected()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceAlreadyConnected,
            message: `Peripheral with identifier ${peripheralIdentifier} is already connected`
        })
        throw error
    }
}

export function errorConnectionFailed(peripheralIdentifier: string): void {
    throw new SimulatedBleError({
        errorCode: BleErrorCode.DeviceConnectionFailed,
        message: `Connecting to peripheral with id ${peripheralIdentifier} failed`
    })
}

export function errorIfNotConnected(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (!peripheralsById.get(peripheralIdentifier)?.isConnected()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceNotConnected,
            message: `Peripheral with identifier ${peripheralIdentifier} is not connected`
        })
        throw error
    }
}