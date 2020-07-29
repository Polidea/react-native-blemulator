import { AdapterState, UUID, Base64 } from "../../types";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { TransferDescriptor, mapToTransferDescriptor } from "../internal-types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
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
    errorIfDescriptorNotFound,
    errorIfDescriptorNotWritable,
    errorIfPayloadTooLarge,
    errorIfPayloadMalformed,
    errorIfOperationCancelled
} from "../error_creator";
import { SimulatedDescriptor } from "../../simulated-descriptor";
import { MAX_MTU } from "./mtu-delegate";
import { TransactionMonitor } from "../transaction-monitor";

export class DescriptorsDelegate {
    private getAdapterState: () => AdapterState
    private transactionMonitor: TransactionMonitor

    constructor(getAdapterState: () => AdapterState, transactionMonitor: TransactionMonitor) {
        this.getAdapterState = getAdapterState
        this.transactionMonitor = transactionMonitor
    }

    async readDescriptor(
        peripherals: Array<SimulatedPeripheral>,
        descriptorId: number,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithDescriptor(peripherals, descriptorId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor = matchedPeripheral!.getDescriptor(descriptorId)!
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor.characteristic?.service?.uuid,
                characteristicUuid: descriptor.characteristic?.uuid,
                descriptorUuid: descriptor.uuid
            })
            return await this.readAndMapDescriptor(descriptor, matchedPeripheral!, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async readDescriptorForCharacteristic(
        peripherals: Array<SimulatedPeripheral>,
        characteristicId: number,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForCharacteristic(characteristicId, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor?.characteristic?.service?.uuid,
                characteristicUuid: descriptor?.characteristic?.uuid,
                descriptorUuid: descriptor?.uuid
            })
            return await this.readAndMapDescriptor(descriptor!, matchedPeripheral!, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async readDescriptorForService(
        peripherals: Array<SimulatedPeripheral>,
        serviceId: number,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForService(serviceId, characteristicUuid, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor?.characteristic?.service?.uuid,
                characteristicUuid: descriptor?.characteristic?.uuid,
                descriptorUuid: descriptor?.uuid
            })
            return await this.readAndMapDescriptor(descriptor!, matchedPeripheral!, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
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
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForCharacteristicAndService(serviceUuid, characteristicUuid, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor?.characteristic?.service?.uuid,
                characteristicUuid: descriptor?.characteristic?.uuid,
                descriptorUuid: descriptor?.uuid
            })
            return await this.readAndMapDescriptor(descriptor!, matchedPeripheral!, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    private async readAndMapDescriptor(
        descriptor: SimulatedDescriptor, peripheral: SimulatedPeripheral, transactionId: string, internalTransactionId: number
    ): Promise<TransferDescriptor> {
        errorIfDescriptorNotReadable(descriptor)
        const value: Base64 = await descriptor.read()

        errorChecksAfterOperation(this.getAdapterState(), peripheral)
        errorIfPayloadTooLarge(
            value,
            MAX_MTU,
            BleErrorCode.DescriptorReadFailed, {
            descriptorUuid: descriptor.uuid
        })
        errorIfPayloadMalformed(value)
        errorIfOperationCancelled(transactionId, internalTransactionId, this.transactionMonitor, {
            peripheralId: peripheral.id,
            serviceUuid: descriptor?.characteristic?.service?.uuid,
            characteristicUuid: descriptor?.characteristic?.uuid,
            descriptorUuid: descriptor?.uuid
        })
        const readDescriptor: TransferDescriptor = mapToTransferDescriptor(descriptor, peripheral.id, value)
        return readDescriptor
    }

    async writeDescriptorForDevice(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralId: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForCharacteristicAndService(serviceUuid, characteristicUuid, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor?.characteristic?.service?.uuid,
                characteristicUuid: descriptor?.characteristic?.uuid,
                descriptorUuid: descriptor?.uuid
            })
            return await this.writeAndMapDescriptor(descriptor!, matchedPeripheral!, value, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async writeDescriptorForService(
        peripherals: Array<SimulatedPeripheral>,
        serviceId: number,
        characteristicUuid: UUID,
        descriptorUuid: UUID,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForService(serviceId, characteristicUuid, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor?.characteristic?.service?.uuid,
                characteristicUuid: descriptor?.characteristic?.uuid,
                descriptorUuid: descriptor?.uuid
            })
            return await this.writeAndMapDescriptor(descriptor!, matchedPeripheral!, value, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async writeDescriptorForCharacteristic(
        peripherals: Array<SimulatedPeripheral>,
        characteristicId: number,
        descriptorUuid: UUID,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor | undefined
                = matchedPeripheral!.getDescriptorForCharacteristic(characteristicId, descriptorUuid)
            errorIfDescriptorNotFound(descriptor)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor?.characteristic?.service?.uuid,
                characteristicUuid: descriptor?.characteristic?.uuid,
                descriptorUuid: descriptor?.uuid
            })
            return await this.writeAndMapDescriptor(descriptor!, matchedPeripheral!, value, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async writeDescriptor(
        peripherals: Array<SimulatedPeripheral>,
        descriptorId: number,
        value: Base64,
        transactionId: string
    ): Promise<TransferDescriptor | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            const matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithDescriptor(peripherals, descriptorId)
            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)
            const descriptor: SimulatedDescriptor = matchedPeripheral!.getDescriptor(descriptorId)!
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: descriptor?.characteristic?.service?.uuid,
                characteristicUuid: descriptor?.characteristic?.uuid,
                descriptorUuid: descriptor?.uuid
            })
            return await this.writeAndMapDescriptor(descriptor, matchedPeripheral!, value, transactionId, internalId)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    private async writeAndMapDescriptor(
        descriptor: SimulatedDescriptor, peripheral: SimulatedPeripheral, value: Base64, transactionId: string, internalTransactionId: number
    ): Promise<TransferDescriptor> {
        errorIfDescriptorNotWritable(descriptor)
        errorIfPayloadTooLarge(
            value,
            MAX_MTU,
            BleErrorCode.DescriptorWriteFailed, {
            descriptorUuid: descriptor.uuid
        })
        errorIfPayloadMalformed(value)
        await descriptor.write(value)
        errorChecksAfterOperation(this.getAdapterState(), peripheral)
        errorIfOperationCancelled(transactionId, internalTransactionId, this.transactionMonitor, {
            peripheralId: peripheral.id,
            serviceUuid: descriptor?.characteristic?.service?.uuid,
            characteristicUuid: descriptor?.characteristic?.uuid,
            descriptorUuid: descriptor?.uuid
        })
        return mapToTransferDescriptor(descriptor, peripheral.id, value)
    }
}
