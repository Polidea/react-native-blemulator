import { UUID, Base64 } from "../types";
import { SimulatedService, SimulatedCharacteristic, SimulatedDescriptor } from "../..";

export interface TransferService {
    peripheralId: string,
    id: number,
    uuid: UUID,
    characteristics: Array<TransferCharacteristic>
}

export interface TransferCharacteristic {
    peripheralId: string,
    id: number,
    uuid: UUID,
    serviceId: number,
    serviceUuid: UUID,
    isReadable: boolean,
    isWritableWithResponse: boolean,
    isWritableWithoutResponse: boolean,
    isNotifiable: boolean,
    isIndicatable: boolean,
    isNotifying: boolean,
    value: Base64 | null,
    descriptors: Array<TransferDescriptor> | null
}

export interface TransferDescriptor {
    peripheralId: string,
    id: number,
    uuid: UUID,
    characteristicId: number,
    characteristicUuid: UUID,
    serviceId: number,
    serviceUuid: UUID,
    value: Base64 | null
}

export function mapToTransferService(service: SimulatedService, peripheralId: string): TransferService {
    return {
        peripheralId: peripheralId,
        id: service.id,
        uuid: service.uuid,
        characteristics: service.getCharacteristics().map(
            (charateristic) => mapToTransferCharacteristic(
                charateristic, peripheralId, undefined, charateristic.getDescriptors()
            )
        )
    }
}

export function mapToTransferCharacteristic(characteristic: SimulatedCharacteristic, peripheralId: string,
    value?: Base64, descriptors?: Array<SimulatedDescriptor>): TransferCharacteristic {
    return {
        peripheralId: peripheralId,
        id: characteristic.id,
        uuid: characteristic.uuid,
        serviceId: characteristic.service!.id,
        serviceUuid: characteristic.service!.uuid,
        isReadable: characteristic.isReadable,
        isIndicatable: characteristic.isIndicatable,
        isNotifiable: characteristic.isNotifiable,
        isNotifying: characteristic.isNotifying,
        isWritableWithResponse: characteristic.isWritableWithResponse,
        isWritableWithoutResponse: characteristic.isWritableWithoutResponse,
        descriptors: descriptors ? descriptors?.map((descriptor) => mapToTransferDescriptor(descriptor, peripheralId)) : null,
        value: value ? value : null
    }
}

export function mapToTransferDescriptor(descriptor: SimulatedDescriptor, peripheralId: string, value?: Base64): TransferDescriptor {
    return {
        peripheralId: peripheralId,
        id: descriptor.id,
        uuid: descriptor.uuid,
        characteristicId: descriptor.characteristic!.id,
        characteristicUuid: descriptor.characteristic!.uuid,
        serviceId: descriptor.characteristic!.service!.id,
        serviceUuid: descriptor.characteristic!.service!.uuid,
        value: value ? value : null
    }
}