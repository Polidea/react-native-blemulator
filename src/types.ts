export type ValueListener = (newValue: Base64) => void

export interface Subscription {
    dispose(): void
}

export type Base64 = string
export type UUID = string