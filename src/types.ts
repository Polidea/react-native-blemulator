export type ValueListener = (newValue: Base64) => void

export enum AdapterState {
    POWERED_ON,
    POWERED_OFF
}

export enum ConnectionState {
    CONNECTING, CONNECTED, DISCONNECTING, DISCONNECTED
}

export interface Subscription {
    dispose(): void
}

export type Base64 = string
export type UUID = string