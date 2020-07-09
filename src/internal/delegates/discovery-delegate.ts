import { SimulatedPeripheral } from "../../simulated-peripheral";
import { AdapterState } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedService } from "../../simulated-service";
import { errorIfBluetoothNotOn, errorIfUnknown, errorIfNotConnected, errorIfDisconnected } from "../error_creator";

export class DiscoveryDelegate {
    async discovery(adapterState: AdapterState, peripherals: Map<string, SimulatedPeripheral>, peripheralIdentifier: string): Promise<SimulatedBleError | Array<SimulatedService>> {
        try {
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfNotConnected(peripherals, peripheralIdentifier)
            await peripherals.get(peripheralIdentifier)?.onDiscovery()
            errorIfDisconnected(peripherals, peripheralIdentifier)
            return peripherals.get(peripheralIdentifier)!.getServices()
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                console.error(error)
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }
}