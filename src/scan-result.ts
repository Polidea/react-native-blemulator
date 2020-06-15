import { UUID, Base64 } from "./types"

export class ScanResult {
    id: String
    name?: String
    localName?: String
    isConnectable?: boolean
    manufacturerData?: Base64
    serviceData?: Map<UUID, Base64>
    serviceUuids?: Array<UUID>
    solicitedServiceUuids?: Array<UUID>
    overflowServiceUuids?: Array<UUID>
    txPowerLevel?: number
    rssi: number

    constructor({id, isConnectable, name, localName, manufacturerData, serviceData, serviceUuids, solicitedServiceUuids, overflowServiceUuids, txPowerLevel, rssi}: {
        id: String,
        isConnectable?: boolean,
        name?: String,
        localName?: String,
        manufacturerData?: Base64,
        serviceData?: Map<UUID, Base64>,
        serviceUuids?: Array<UUID>,
        solicitedServiceUuids?: Array<UUID>,
        overflowServiceUuids?: Array<UUID>,
        txPowerLevel?: number,
        rssi: number
    }) {
        this.id = id
        this.isConnectable = isConnectable
        this.name = name
        this.localName = localName
        this.manufacturerData = manufacturerData
        this.serviceData = serviceData
        this.serviceUuids = serviceUuids
        this.solicitedServiceUuids = solicitedServiceUuids
        this.overflowServiceUuids = overflowServiceUuids
        this.txPowerLevel = txPowerLevel
        this.rssi = rssi
    }
}