import { SimulatedPeripheral } from "../simulated-peripheral";
import { SimulatedBleError, BleErrorCode } from "../ble-error";
import { AdapterState, Base64, UUID } from "../types";
import { SimulatedCharacteristic } from "../simulated-characteristic";
import { SimulatedDescriptor } from "../simulated-descriptor";

export function errorIfScanInProgress(isScanInProgress: boolean): void {
    if (isScanInProgress) {
        throw new SimulatedBleError({
            errorCode: BleErrorCode.ScanStartFailed,
            message: "Scan is already in progress",
        })
    }
}

export function errorIfBluetoothNotSupported(adapterState: AdapterState): void {
    if (adapterState === AdapterState.UNSUPPORTED) {
        throw new SimulatedBleError({
            errorCode: BleErrorCode.BluetoothUnsupported,
            message: "Bluetooth unsupported",
        })
    }
}

export function errorIfBluetoothNotOn(adapterState: AdapterState): void {
    if (adapterState !== AdapterState.POWERED_ON) {
        throw new SimulatedBleError({
            errorCode: BleErrorCode.BluetoothPoweredOff,
            message: "Bluetooth adapter is not powered on",
        })
    }
}

export function errorIfUnknown(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (!peripheralsById.has(peripheralIdentifier)) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceNotFound,
            message: `Peripheral with identifier ${peripheralIdentifier} is unknown`,
            deviceId: peripheralIdentifier,
        })
        throw error
    }
}

export function errorIfConnected(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (peripheralsById.get(peripheralIdentifier)?.isConnected()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceAlreadyConnected,
            message: `Peripheral with identifier ${peripheralIdentifier} is already connected`,
            deviceId: peripheralIdentifier,
        })
        throw error
    }
}

export function errorConnectionFailed(peripheralIdentifier: string): void {
    throw new SimulatedBleError({
        errorCode: BleErrorCode.DeviceConnectionFailed,
        message: `Connecting to peripheral with id ${peripheralIdentifier} failed`,
    })
}

export function errorIfNotConnected(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (!peripheralsById.get(peripheralIdentifier)?.isConnected()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceNotConnected,
            message: `Peripheral with identifier ${peripheralIdentifier} is not connected`,
        })
        throw error
    }
}


export function errorIfDisconnected(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (!peripheralsById.get(peripheralIdentifier)?.isConnected()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceDisconnected,
            message: `Peripheral with identifier ${peripheralIdentifier} has disconnected`,
            deviceId: peripheralIdentifier,
        })
    }
}

export function errorIfPeripheralNotFound(peripheral: SimulatedPeripheral | null | undefined): void {
    if (!peripheral) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceNotFound,
            message: `Peripheral not found`,
        })
        throw error
    }
}

export function errorIfPeripheralNotConnected(peripheral: SimulatedPeripheral): void {
    if (!peripheral.isConnected()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceNotConnected,
            message: `Peripheral with identifier ${peripheral.id} is not connected`,
            deviceId: peripheral.id,
        })
        throw error
    }
}

export function errorIfPeripheralDisconnected(peripheral: SimulatedPeripheral): void {
    if (!peripheral.isConnected()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceDisconnected,
            message: `Peripheral with identifier ${peripheral.id} has disconnected`,
            deviceId: peripheral.id,
        })
        throw error
    }
}

export function errorIfCharacteristicNotReadable(characteristic: SimulatedCharacteristic): void {
    if (!characteristic.isReadable) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.CharacteristicReadFailed,
            message: `Characteristic (id: ${characteristic.id}, uuid: ${characteristic.uuid}) is not readable`,
            characteristicUuid: characteristic.uuid,
        })
        throw error
    }
}

export function errorIfDiscoveryNotDone(peripheral: SimulatedPeripheral): void {
    if (!peripheral.isDiscoveryDone()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.CharacteristicsNotDiscovered,
            message: 'Discovery not done',
            deviceId: peripheral.id,
        })
        throw error
    }
}

export function errorIfCharacteristicNotFound(characteristic?: SimulatedCharacteristic): void {
    if (!characteristic) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.CharacteristicNotFound,
            message: `Characteristic not found`,
        })
        throw error
    }
}

export function errorIfMtuNegotiated(peripheralsById: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): void {
    if (peripheralsById.get(peripheralIdentifier)?.isMtuNegotiated()) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DeviceMTUChangeFailed,
            message: `MTU hase been already negotiated for pripheral ${peripheralIdentifier}`,
            deviceId: peripheralIdentifier,
        })
        throw error
    }
}

export function errorChecksForAccessToGatt(adapterState: AdapterState, peripheral: SimulatedPeripheral | null | undefined) {
    errorIfBluetoothNotSupported(adapterState)
    errorIfBluetoothNotOn(adapterState)
    errorIfPeripheralNotFound(peripheral)
    errorIfPeripheralNotConnected(peripheral!)
    errorIfDiscoveryNotDone(peripheral!)
}

export function errorChecksAfterOperation(adapterState: AdapterState, peripheral: SimulatedPeripheral) {
    errorIfBluetoothNotSupported(adapterState)
    errorIfBluetoothNotOn(adapterState)
    errorIfPeripheralDisconnected(peripheral)
}

export function errorIfNotMonitorable(characteristic: SimulatedCharacteristic): void {
    if (!characteristic.isIndicatable && !characteristic.isNotifiable) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.CharacteristicNotifyChangeFailed,
            message: `Characteristic(serviceUuid: ${characteristic.service?.uuid}, uuid: ${characteristic.uuid}) does not support either notifications or indications`,
            characteristicUuid: characteristic.uuid
        })
        throw error
    }
}

export function errorIfNotWritableWithResponse(characteristic: SimulatedCharacteristic): void {
    if (!characteristic.isWritableWithResponse) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.CharacteristicWriteFailed,
            message: 'Characteristic not writable with response',
            characteristicUuid: characteristic.uuid,
        })
        throw error
    }
}

export function errorIfNotWritableWithoutResponse(characteristic: SimulatedCharacteristic): void {
    if (!characteristic.isWritableWithoutResponse) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.CharacteristicWriteFailed,
            message: 'Characteristic not writable without response',
            characteristicUuid: characteristic.uuid,
        })
        throw error
    }
}

export function errorIfDescriptorNotReadable(descriptor: SimulatedDescriptor): void {
    if (!descriptor.isReadable) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DescriptorReadFailed,
            message: 'Descriptor not readable',
            descriptorUuid: descriptor.uuid,
        })
        throw error
    }
}

export function errorIfDescriptorNotFound(descriptor: SimulatedDescriptor | undefined | null): void {
    if (!descriptor) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DescriptorNotFound,
            message: 'Descriptor not found',
        })
        throw error
    }
}

export function errorIfDescriptorNotWritable(descriptor: SimulatedDescriptor): void {
    if (!descriptor.isWritable) {
        const error: SimulatedBleError = new SimulatedBleError({
            errorCode: BleErrorCode.DescriptorWriteFailed,
            message: 'Descriptor not writable',
            descriptorUuid: descriptor.uuid,
        })
        throw error
    }
}

export function errorIfPayloadMalformed(value: Base64) {
    if (value.length % 4 !=0) {
        const error: Error = new Error('Value is in incorrect format, Base64 string\'s length must be divisible by 4')
        throw error
    }
}

export function errorIfPayloadTooLarge(
    payload: Base64,
    mtu: number,
    errorCode: BleErrorCode,
    args?: {
        noError?: boolean
        descriptorUuid?: UUID,
        characteristicUuid?: UUID
    }
): void {
    //Base64 encodes 3 bytes on 4 characters, hence the uncertainty
    const lowerLimit: number = Math.floor(mtu / 3) * 3
    const upperLimit: number = Math.ceil(mtu / 3) * 3

    const payloadSizeInBytes: number = (payload.length / 4) * 3

    if (payloadSizeInBytes > upperLimit) {
        console.warn(`Payload's (${payload}) size (${payloadSizeInBytes}) exceeds the limit (${mtu}) for this kind of operation`)
        if (!args?.noError) {
            const error: SimulatedBleError = new SimulatedBleError({
                errorCode: errorCode,
                message: "Operation failed",
                descriptorUuid: args?.descriptorUuid,
                characteristicUuid: args?.characteristicUuid
            })
            throw error
        }
    } else if (payloadSizeInBytes > lowerLimit) {
        console.warn(`Payload's (${payload}) size (${payloadSizeInBytes}) might be exceeding the limit (${mtu}) for this kind of operation`)
    }
}
