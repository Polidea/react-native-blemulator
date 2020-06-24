import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfUnknown, errorIfConnected, errorIfNotConnected, errorIfBluetoothNotOn, errorConnectionFailed } from "../error_creator";
import { AdapterState, ConnectionState, Subscription } from "../../types";

export class ConnectionDelegate {
    private connectionStatePublisher: ((id: string, state: ConnectionState) => void) | undefined = undefined
    private connectionStateSubscriptions: Map<string, Subscription> = new Map()

    setConnectionStatePublisher(publisher: (id: string, state: ConnectionState) => void) {
        this.connectionStatePublisher = publisher
    }

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

            const subscription = peripheral.listenToConnectionStateChanges((state) => {
                if (this.connectionStatePublisher) {
                    this.connectionStatePublisher(peripheral.id, state)
                }
                if (state === ConnectionState.DISCONNECTED) {
                    subscription.dispose()
                    this.connectionStateSubscriptions.delete(peripheralIdentifier)
                }
            })
            this.connectionStateSubscriptions.set(peripheralIdentifier, subscription)

            const willConnect = await peripheral.onConnectRequest()
            if (!willConnect) {
                errorConnectionFailed(peripheralIdentifier);
            }
            if (peripheral.disconnectIfDisconnectionPending()) {
                errorConnectionFailed(peripheralIdentifier);
            }
            await peripheral.onConnect()
            if (peripheral.disconnectIfDisconnectionPending()) {
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

    async isConnected(adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string): Promise<boolean | SimulatedBleError | undefined> {

        try {
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            return peripherals.get(peripheralIdentifier)?.isConnected()
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                console.error(error)
            }
        }
    }
}