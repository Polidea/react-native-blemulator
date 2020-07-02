export type ValueListener = (newValue: Base64) => void
export type ConnectionStateListener = (connectionState: ConnectionState) => void

export enum AdapterState {
    POWERED_ON = 'PoweredOn', POWERED_OFF = 'PoweredOff', UNKNOWN = 'Unknown', RESETTING = 'Resetting', UNSUPPORTED = 'Unsupported', UNAUTHORIZED = 'Unauthorized'
}

export enum ConnectionState {
    CONNECTING, CONNECTED, DISCONNECTING, DISCONNECTED
}

export interface Subscription {
    dispose(): void
}

export type Base64 = string
export type UUID = string