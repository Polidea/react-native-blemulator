import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfUnknown, errorIfConnected, errorIfNotConnected, errorIfBluetoothNotOn, errorConnectionFailed } from "../error_creator";
import { AdapterState } from "../../types";

export class ConnectionDelegate {
    async connect(
        adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string
    ): Promise<SimulatedBleError | undefined> {

        try {
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfConnected(peripherals, peripheralIdentifier)
            const peripheral: SimulatedPeripheral = peripherals.get(peripheralIdentifier) as SimulatedPeripheral
            peripheral.setIsDisconnectionPending(false)
            const willConnect = await peripheral.onConnectRequest()
            if (!willConnect) {
                errorConnectionFailed(peripheralIdentifier);
            }
            if (peripheral.isDisconnectionPending()) {
                errorConnectionFailed(peripheralIdentifier);
            }
            await peripheral.onConnect()
            if (peripheral.isDisconnectionPending()) {
                errorConnectionFailed(peripheralIdentifier);
            }
        } catch (error) {
            if (error instanceof SimulatedBleError)
                return error
            else {
                console.error(error)
            }
        }
    }

    async disconnect(
        adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string
    ): Promise<SimulatedBleError | undefined> {

        try {
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            if (peripherals.get(peripheralIdentifier)?.isConnected) {
                await peripherals.get(peripheralIdentifier)?.onDisconnect()
            } else {
                peripherals.get(peripheralIdentifier)?.setIsDisconnectionPending(true)
            }
            
        } catch (error) {
            if (error instanceof SimulatedBleError)
                return error
            else {
                console.error(error)
            }
        }
    }
}