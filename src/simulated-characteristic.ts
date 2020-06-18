import { UUID, Base64, ValueListener, Subscription } from "./types";
import { SimulatedDescriptor } from "./simulated-descriptor";
import { IdGenerator } from "./internal/utils";
import { SimulatedService } from "./simulated-service";

interface ExtendedValueListener {
    valueListener: ValueListener
    didSetNotifying: boolean
}

export class SimulatedCharacteristic {
    readonly uuid: UUID
    readonly id: number
    readonly isReadable: boolean
    readonly isWritableWithResponse: boolean
    readonly isWritableWithoutResponse: boolean
    readonly isNotifiable: boolean
    readonly isIndicatable: boolean
    readonly convenienceName?: string
    isNotifying: boolean = false
    service: SimulatedService | null = null
    private value: Base64
    private descriptorsById: Map<number, SimulatedDescriptor> = new Map<number, SimulatedDescriptor>()
    private descriptorsByUuid: Map<UUID, SimulatedDescriptor> = new Map<UUID, SimulatedDescriptor>()
    private listeners: Map<string, ExtendedValueListener> = new Map<string, ExtendedValueListener>()

    constructor(
        { uuid, isReadable = true, isWritableWithResponse = true, isWritableWithoutResponse = true,
            isNotifiable = false, isIndicatable = false, initialValue, descriptors = [], convenienceName
        }: {
            uuid: UUID, isReadable: boolean, isWritableWithResponse: boolean,
            isWritableWithoutResponse: boolean, isNotifiable: boolean, isIndicatable: boolean, initialValue: Base64,
            descriptors: Array<SimulatedDescriptor>, convenienceName?: string
        }) {
        this.uuid = uuid.toUpperCase()
        this.isReadable = isReadable
        this.isWritableWithResponse = isWritableWithResponse
        this.isWritableWithoutResponse = isWritableWithoutResponse
        this.isNotifiable = isNotifiable
        this.isIndicatable = isIndicatable
        this.convenienceName = convenienceName
        this.id = IdGenerator.nextId()
        this.value = initialValue


        descriptors.forEach((descriptor) => {
            this.descriptorsById.set(descriptor.id, descriptor)
            this.descriptorsByUuid.set(descriptor.uuid, descriptor)
            descriptor.attachToCharacteristic(this)
        })
    }

    attachToService(service: SimulatedService): void {
        this.service = service
    }

    async read(): Promise<Base64> {
        return this.value
    }

    async write(newValue: Base64, { sendNotification = true }): Promise<void> {
        this.value = newValue
        if (sendNotification) {
            this.listeners.forEach((extendedListener) => extendedListener.valueListener(newValue))
        }
    }

    monitor(listener: ValueListener, { setNotifying = true }): Subscription {
        let id = IdGenerator.nextId().toString()
        this.listeners.set(id, { valueListener: listener, didSetNotifying: setNotifying })
        if (setNotifying) {
            this.isNotifying = true
        }

        let that = this
        return {
            dispose() {
                that.listeners.delete(id)
                let listeners: Array<ExtendedValueListener> = Array.from(that.listeners.values())
                let shouldTurnOffIsNotifying = listeners.filter((extendedListener) => extendedListener.didSetNotifying).length === 0
                if (shouldTurnOffIsNotifying) {
                    that.isNotifying = false
                }
            }
        }
    }

    getDescriptors(): Array<SimulatedDescriptor> {
        return Array.from(this.descriptorsById.values())
    }

    getDescriptor(id: number): SimulatedDescriptor | undefined {
        return this.descriptorsById.get(id)
    }

    getDescriptorByUuid(uuid: UUID): SimulatedDescriptor | undefined {
        return this.descriptorsByUuid.get(uuid)
    }
}