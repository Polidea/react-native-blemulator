import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfUnknown, errorIfConnected, errorIfNotConnected, errorIfBluetoothNotOn, errorConnectionFailed, errorIfMtuNegotiated } from "../error_creator";
import { AdapterState, ConnectionState, Subscription } from "../../types";
import { Platform } from 'react-native';

export const DEFAULT_MTU = 23
export const MIN_MTU = 23
export const MAX_iOS_MTU: number = 185
export const MAX_MTU = 512

export class MtuDelegate {
    static readonly myReadOnlyProperty = 1;
    async requestMtu(
        adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        mtu: number
    ): Promise<SimulatedBleError | number> {
        try {
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfNotConnected(peripherals, peripheralIdentifier)
            let negotiatedMtu: number
            if (Platform.OS === "ios") {
                negotiatedMtu = peripherals.get(peripheralIdentifier)!.getMtu()
            } else {
                errorIfMtuNegotiated(peripherals, peripheralIdentifier)
                negotiatedMtu = await peripherals.get(peripheralIdentifier)!.onRequestMtu(mtu)
            }
            errorIfNotConnected(peripherals, peripheralIdentifier)
            return negotiatedMtu
        } catch (error) {
            if (error instanceof SimulatedBleError)
                return error
            else {
                console.error(error)
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }
}