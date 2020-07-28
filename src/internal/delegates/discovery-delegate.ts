import { SimulatedPeripheral } from "../../simulated-peripheral";
import { AdapterState } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedService } from "../../simulated-service";
import { errorIfBluetoothNotOn, errorIfUnknown, errorIfNotConnected, errorIfDisconnected, errorIfBluetoothNotSupported } from "../error_creator";
import { mapErrorToSimulatedBleError } from "../utils";

export class DiscoveryDelegate {
    private getAdapterState: () => AdapterState

    constructor(getAdapterState: () => AdapterState) {
        this.getAdapterState = getAdapterState
    }

    async discovery(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string
    ): Promise<SimulatedBleError | Array<SimulatedService>> {
        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfNotConnected(peripherals, peripheralIdentifier)
            
            await peripherals.get(peripheralIdentifier)?.onDiscovery()

            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfDisconnected(peripherals, peripheralIdentifier)
            return peripherals.get(peripheralIdentifier)!.getServices()
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }
}