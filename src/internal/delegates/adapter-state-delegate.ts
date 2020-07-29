import { AdapterState } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { delay, mapErrorToSimulatedBleError } from "../utils";
import { Platform } from "react-native";
import { TransactionMonitor } from "../transaction-monitor";
import { errorIfNotAndroid, errorIfBluetoothNotSupported, errorIfOperationCancelled } from "../error_creator";


const bluetoothUnsupportedErrorCreator = () => {
    return new SimulatedBleError({
        errorCode: BleErrorCode.BluetoothUnsupported,
        message: "Bluetooth unsupported",
    })
}

export type AdapterStateChangeListener = (newState: AdapterState) => void

export class AdapterStateDelegate {
    private adapterState: AdapterState = AdapterState.POWERED_ON
    private delay?: number
    private listener?: AdapterStateChangeListener
    private transactionMonitor: TransactionMonitor

    constructor(transactionMonitor: TransactionMonitor) {
        this.transactionMonitor = transactionMonitor
    }

    setAdapterState(adapterState: AdapterState) {
        this.onAdapterStateChanged(adapterState)
    }

    getAdapterState(): AdapterState {
        return this.adapterState;
    }

    setAdapterStateChangeDelay(delay?: number) {
        this.delay = delay
    }

    setAdapterStateChangeListener(listener?: AdapterStateChangeListener) {
        this.listener = listener
        if (listener) {
            listener(this.adapterState)
        }
    }

    async enable(transactionId: string): Promise<SimulatedBleError | undefined> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            errorIfNotAndroid()
            errorIfBluetoothNotSupported(this.adapterState)
            if (this.adapterState === AdapterState.POWERED_ON) {
                throw new SimulatedBleError({
                    errorCode: BleErrorCode.BluetoothStateChangeFailed,
                    message: "Couldn't set Bluetooth adapter's state to POWERED_ON",
                })
            }
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor)

            this.onAdapterStateChanged(AdapterState.RESETTING)

            if (this.delay) {
                await delay(this.delay)
            }
            this.onAdapterStateChanged(AdapterState.POWERED_ON)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async disable(transactionId: string): Promise<SimulatedBleError | undefined> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            errorIfNotAndroid()
            errorIfBluetoothNotSupported(this.adapterState)
            if (this.adapterState === AdapterState.POWERED_OFF) {
                throw new SimulatedBleError({
                    errorCode: BleErrorCode.BluetoothStateChangeFailed,
                    message: "Couldn't set Bluetooth adapter's state to POWERED_OFF",
                })
            }

            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor)
            this.onAdapterStateChanged(AdapterState.RESETTING)

            if (this.delay) {
                await delay(this.delay)
            }
            this.onAdapterStateChanged(AdapterState.POWERED_OFF)
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    private onAdapterStateChanged(newValue: AdapterState) {
        this.adapterState = newValue
        if (this.listener) {
            this.listener(newValue)
        }
    }
}
