import { AdapterState, UUID, Base64 } from "../../types";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { TransferDescriptor, mapToTransferDescriptor } from "../internal-types";
import { SimulatedBleError } from "../../ble-error";
import {
    findPeripheralWithDescriptor,
    mapErrorToSimulatedBleError,
    findPeripheralWithService,
    findPeripheralWithCharacteristic
} from "../utils";
import {
    errorChecksForAccessToGatt,
    errorIfDescriptorNotReadable,
    errorChecksAfterOperation,
    errorIfDescriptorNotFound
} from "../error_creator";
import { SimulatedDescriptor } from "../../simulated-descriptor";

export class DescriptorsDelegate {
    private getAdapterState: () => AdapterState

    constructor(getAdapterState: () => AdapterState) {
        this.getAdapterState = getAdapterState
    }

    async readDescriptor(
        peripherals: Array<SimulatedPeripheral>,
        descriptorId: number,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithDescriptor(peripherals, descriptorId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor = matchedPeripheral!.getDescriptor(descriptorId)!
            return this.readAndMapDescriptor(descriptor, matchedPeripheral!)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }

    async readDescriptorForCharacteristic(
        peripherals: Array<SimulatedPeripheral>,
        characteristicId: number,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForCharacteristic(characteristicId, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            return this.readAndMapDescriptor(descriptor!, matchedPeripheral!)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }

    async readDescriptorForService(
        peripherals: Array<SimulatedPeripheral>,
        serviceId: number,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForService(serviceId, characteristicUuid, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            return this.readAndMapDescriptor(descriptor!, matchedPeripheral!)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }

    async readDescriptorForDevice(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralId: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        try {
            const matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForCharacteristicAndService(serviceUuid, characteristicUuid, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            return this.readAndMapDescriptor(descriptor!, matchedPeripheral!)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }

    private async readAndMapDescriptor(
        descriptor: SimulatedDescriptor, peripheral: SimulatedPeripheral
    ): Promise<TransferDescriptor> {
        errorIfDescriptorNotReadable(descriptor)
        const value: Base64 = await descriptor.read()
        errorChecksAfterOperation(this.getAdapterState(), peripheral)
        const readDescriptor: TransferDescriptor = mapToTransferDescriptor(descriptor, peripheral.id, value)
        return readDescriptor
    }
}
