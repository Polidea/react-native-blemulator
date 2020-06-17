import { ValueListener, Base64, Subscription, UUID } from "./types"
import { IdGenerator } from "./internal/utils"
import { SimulatedCharacteristic } from "./simulated-characteristic"

export class SimulatedDescriptor {
    readonly uuid: UUID
    readonly convenienceName?: string
    readonly isReadable: boolean
    readonly isWritable: boolean
    readonly id: number
    private value: Base64
    characteristic: SimulatedCharacteristic | null = null
    private listeners: Map<string, ValueListener> = new Map<string, ValueListener>()

    constructor({ uuid, initialValue, isReadable = true, isWritable = true, convenienceName }:
        { uuid: string, initialValue: Base64, isReadable: boolean, isWritable: boolean, convenienceName?: string }) {
        this.id = IdGenerator.nextId()
        this.uuid = uuid.toUpperCase()
        this.value = initialValue
        this.isReadable = isReadable
        this.isWritable = isWritable
        this.convenienceName = convenienceName
    }

    attachToCharacteristic(characteristic: SimulatedCharacteristic) {
        this.characteristic = characteristic
    }

    async read(): Promise<Base64> {
        return this.value
    }

    async write(value: Base64) {
        this.value = value
        this.listeners.forEach((listener, key, map) => { listener(value) })
    }

    monitor(listener: ValueListener): Subscription {
        const listenerId = IdGenerator.nextId().toString()
        this.listeners.set(listenerId, listener)
        const that = this
        return {
            dispose() {
                that.listeners.delete(listenerId)
            }
        }
    }
}