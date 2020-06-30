import { AdapterState } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { delay } from "../utils";
import { Platform } from "react-native";


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

    async enable(): Promise<SimulatedBleError | undefined> {
        if (Platform.OS !== 'android') {
            return new SimulatedBleError({
                errorCode: BleErrorCode.BluetoothStateChangeFailed,
                message: "Platform doesn't support this functionality",
            })
        }

        if (this.adapterState === AdapterState.UNSUPPORTED) {
            return bluetoothUnsupportedErrorCreator()
        }

        if (this.adapterState === AdapterState.POWERED_ON) {
            return new SimulatedBleError({
                errorCode: BleErrorCode.BluetoothStateChangeFailed,
                message: "Couldn't set Bluetooth adapter's state to POWERED_ON",
            })
        }

        this.onAdapterStateChanged(AdapterState.RESETTING)

        if (this.delay) {
            await delay(this.delay)
        }
        this.onAdapterStateChanged(AdapterState.POWERED_ON)
    }

    async disable(): Promise<SimulatedBleError | undefined> {
        if (Platform.OS !== 'android') {
            return new SimulatedBleError({
                errorCode: BleErrorCode.BluetoothStateChangeFailed,
                message: "Platform doesn't support this functionality",
            })
        }

        if (this.adapterState === AdapterState.UNSUPPORTED) {
            return bluetoothUnsupportedErrorCreator()
        }

        if (this.adapterState === AdapterState.POWERED_OFF) {
            return new SimulatedBleError({
                errorCode: BleErrorCode.BluetoothStateChangeFailed,
                message: "Couldn't set Bluetooth adapter's state to POWERED_OFF",
            })
        }

        this.onAdapterStateChanged(AdapterState.RESETTING)

        if (this.delay) {
            await delay(this.delay)
        }
        this.onAdapterStateChanged(AdapterState.POWERED_OFF)
    }

    private onAdapterStateChanged(newValue: AdapterState) {
        this.adapterState = newValue
        if (this.listener) {
            this.listener(newValue)
        }
    }
}