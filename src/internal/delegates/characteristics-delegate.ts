import { Base64, AdapterState, UUID } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfNotReadable, errorIfPeripheralDisconnected, errorIfCharacteristicNotFound, errorChecksForAccessToGatt } from "../error_creator";
import { SimulatedCharacteristic } from "../../simulated-characteristic";
import { TransferCharacteristic, mapToTransferCharacteristic } from "../internal-types";
import { findPeripheralWithService, findPeripheralWithCharacteristic } from "../utils";

export class CharacteristicsDelegate {
    async readCharacteristic(adapterState: AdapterState,
        peripherals: Array<SimulatedPeripheral>,
        characteristicIdentifier: number): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null = findPeripheralWithCharacteristic(peripherals, characteristicIdentifier)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic = matchedPeripheral!.getCharacteristic(characteristicIdentifier)!
            return this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(characteristic!, matchedPeripheral!)
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
            let matchedPeripheral: SimulatedPeripheral | null = findPeripheralWithService(peripherals, serviceIdentifier)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceIdentifier)?.getCharacteristicByUuid(characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)

            return this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(characteristic!, matchedPeripheral!)
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

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined
                = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)

            return this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(characteristic!, matchedPeripheral!)
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }

    private async readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(characteristic: SimulatedCharacteristic,
        peripheral: SimulatedPeripheral): Promise<TransferCharacteristic> {

        errorIfNotReadable(characteristic!)
        const value: Base64 = await characteristic!.read()

        errorIfPeripheralDisconnected(peripheral)
        const returnedCharacteristic: TransferCharacteristic = mapToTransferCharacteristic(characteristic!, peripheral.id, value)
        return returnedCharacteristic
    }
}
