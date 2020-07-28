import { SimulatedBleError } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfUnknown, errorIfNotConnected, errorIfBluetoothNotOn, errorIfMtuNegotiated, errorIfBluetoothNotSupported } from "../error_creator";
import { AdapterState } from "../../types";
import { Platform } from 'react-native';
import { mapErrorToSimulatedBleError } from "../utils";

export const DEFAULT_MTU = 23
export const MIN_MTU = 23
export const MAX_iOS_MTU: number = 185
export const MAX_MTU = 512

export class MtuDelegate {
    private getAdapterState: () => AdapterState

    constructor(getAdapterState: () => AdapterState) {
        this.getAdapterState = getAdapterState
    }

    async requestMtu(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        mtu: number
    ): Promise<SimulatedBleError | number> {
        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfNotConnected(peripherals, peripheralIdentifier)
            let negotiatedMtu: number
            if (Platform.OS === "ios") {
                negotiatedMtu = peripherals.get(peripheralIdentifier)!.getMtu()
            } else {
                errorIfMtuNegotiated(peripherals, peripheralIdentifier)
                negotiatedMtu = await peripherals.get(peripheralIdentifier)!.onRequestMtu(mtu)
            }

            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfNotConnected(peripherals, peripheralIdentifier)
            return negotiatedMtu
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }
}
