export type Base64 = string
export type UUID = string

export class ScanResult {
    id: String
    name?: String
    localName?: String
    isConnectable?: boolean
    manufacturerData?: Base64
    serviceData?: { [uuid: string]: Base64 }
    serviceUuids?: Array<UUID>
    solicitedServiceUuids?: Array<UUID>
    overflowServiceUuids?: Array<UUID>
    txPowerLevel?: number
    rssi: number

    constructor(args: {
        id: String,
        isConnectable?: boolean,
        name?: String,
        localName?: String,
        manufacturerData?: Base64,
        serviceData?: { [uuid: string]: Base64 },
        serviceUuids?: Array<UUID>,
        solicitedServiceUuids?: Array<UUID>,
        overflowServiceUuids?: Array<UUID>,
        txPowerLevel?: number,
        rssi: number
    }) {
        this.id = args.id
        this.isConnectable = args.isConnectable
        this.name = args.name
        this.localName = args.localName
        this.manufacturerData = args.manufacturerData
        this.serviceData = args.serviceData
        this.serviceUuids = args.serviceUuids
        this.solicitedServiceUuids = args.solicitedServiceUuids
        this.overflowServiceUuids = args.overflowServiceUuids
        this.txPowerLevel = args.txPowerLevel
        this.rssi = args.rssi
    }
}