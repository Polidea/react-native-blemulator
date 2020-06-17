import { UUID } from "./types";
import { SimulatedCharacteristic } from "./simulated-characteristic";
import { IdGenerator } from "./internal/utils";

export class SimulatedService {
    readonly uuid: UUID
    readonly id: number
    readonly isAdvertised: boolean
    readonly convenienceName?: string
    private characteristicsById: Map<number, SimulatedCharacteristic> = new Map<number, SimulatedCharacteristic>()
    private characteristicsByUuid: Map<UUID, SimulatedCharacteristic> = new Map<UUID, SimulatedCharacteristic>()

    constructor({ uuid, isAdvertised, convenienceName, characteristics }:
        { uuid: UUID, isAdvertised: boolean, convenienceName?: string, characteristics: Array<SimulatedCharacteristic> }
    ) {
        this.uuid = uuid.toUpperCase()
        this.id = IdGenerator.nextId()
        this.isAdvertised = isAdvertised
        this.convenienceName = convenienceName

        let that = this
        characteristics.forEach((characteristic) => {
            characteristic.attachToService(that)
            this.characteristicsById.set(characteristic.id, characteristic)
            this.characteristicsByUuid.set(characteristic.uuid, characteristic)
        })
    }

    getCharacteristics(): Array<SimulatedCharacteristic> {
        return Array.from(this.characteristicsById.values())
    }

    getCharacteristicById(id: number): SimulatedCharacteristic | undefined {
        return this.characteristicsById.get(id)
    }

    getCharacteristicByUuid(uuid: UUID): SimulatedCharacteristic | undefined {
        return this.characteristicsByUuid.get(uuid)
    }
}