import { Base64, AdapterState, UUID } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfPeripheralNotFound, errorIfPeripheralNotConnected, errorIfNotReadable, errorIfDiscoveryNotDone, errorIfPeripheralDisconnected, errorIfCharacteristicNotFound, errorIfBluetoothNotSupported, errorIfBluetoothNotOn } from "../error_creator";
import { SimulatedCharacteristic } from "../../simulated-characteristic";
import { TransferCharacteristic, mapToTransferCharacteristic } from "../internal-types";

export class CharacteristicsDelegate {
    async readCharacteristic(adapterState: AdapterState,
        peripherals: Array<SimulatedPeripheral>,
        characteristicIdentifier: number): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null = null
            for (let i = 0; i < peripherals.length; i++) {
                if (peripherals[i].getCharacteristic(characteristicIdentifier) != null) {
                    matchedPeripheral = peripherals[i];
                    break
                }
            }

            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic = matchedPeripheral!.getCharacteristic(characteristicIdentifier)!
            errorIfNotReadable(characteristic)
            const value: Base64 = await characteristic.read()

            errorIfPeripheralDisconnected(matchedPeripheral!)
            const returnedCharacteristic: TransferCharacteristic = mapToTransferCharacteristic(characteristic, matchedPeripheral!.id, value)
            return returnedCharacteristic
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }

    async readCharacteristicForService(adapterState: AdapterState,
        peripherals: Array<SimulatedPeripheral>,
        serviceIdentifier: number,
        characteristicUuid: UUID): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null = null
            for (let i = 0; i < peripherals.length; i++) {
                if (peripherals[i].getService(serviceIdentifier) != null) {
                    matchedPeripheral = peripherals[i];
                    break
                }
            }

            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceIdentifier)?.getCharacteristicByUuid(characteristicUuid)

            errorIfCharacteristicNotFound(characteristic)
            errorIfNotReadable(characteristic!)
            const value: Base64 = await characteristic!.read()

            errorIfPeripheralDisconnected(matchedPeripheral!)
            const returnedCharacteristic: TransferCharacteristic = mapToTransferCharacteristic(characteristic!, matchedPeripheral!.id, value)
            return returnedCharacteristic
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }

    async readCharacteristicForDevice(adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        serviceUuid: UUID,
        characteristicUuid: UUID): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralIdentifier)

            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic | undefined = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfNotReadable(characteristic!)
            const value: Base64 = await characteristic!.read()

            errorIfPeripheralDisconnected(matchedPeripheral!)
            const returnedCharacteristic: TransferCharacteristic = mapToTransferCharacteristic(characteristic!, matchedPeripheral!.id, value)
            return returnedCharacteristic
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }
}