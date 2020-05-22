export type Base64 = String
export type UUID = String

export class ScanResult {
    isConnectable: boolean | null
    id: String
    name: String | null
    localName: String | null
    manufacturerData: Base64 | null
    serviceData: { [uuid: String]: Base64 } | null
    serviceUuids: Array<UUID> | null
    solicitedServiceUuids: Array<UUID> | null
    overflowServiceUuids: Array<UUID> | null
    txPowerLevel: number | null

    constructor(
        id: String,
        isConnectable: boolean | null = null,
        name: String | null,
        localName: String | null,
        manufacturerData: Base64 | null,
        serviceData: { [uuid: String]: Base64 } | null,
        serviceUuids: Array<UUID> | null,
        solicitedServiceUuids: Array<UUID> | null,
        overflowServiceUuids: Array<UUID> | null,
        txPowerLevel: number | null
    ) {
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
    }
}