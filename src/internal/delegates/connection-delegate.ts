import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfUnknown, errorIfConnected, errorIfBluetoothNotOn, errorConnectionFailed, errorIfBluetoothNotSupported } from "../error_creator";
import { AdapterState, ConnectionState, Subscription } from "../../types";
import { Platform } from 'react-native';
import { MAX_iOS_MTU } from './mtu-delegate'


export class ConnectionDelegate {
    private connectionStatePublisher: ((id: string, state: ConnectionState) => void) | undefined = undefined
    private connectionStateSubscriptions: Map<string, Subscription> = new Map()
    private pendingDisconnections: Map<string, boolean> = new Map()

    setConnectionStatePublisher(publisher: (id: string, state: ConnectionState) => void) {
        this.connectionStatePublisher = publisher
    }

    async connect(
        adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        requestMtu?: number
    ): Promise<SimulatedBleError | SimulatedPeripheral> {
        try {
            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfConnected(peripherals, peripheralIdentifier)
            const peripheral: SimulatedPeripheral = peripherals.get(peripheralIdentifier) as SimulatedPeripheral
            this.pendingDisconnections.set(peripheralIdentifier, false)

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
                peripheral.onDisconnect({ emit: true })
                errorConnectionFailed(peripheralIdentifier);
            }
            if (this.pendingDisconnections.get(peripheralIdentifier)) {
                peripheral.onDisconnect({ emit: true })
                errorConnectionFailed(peripheralIdentifier);
            }
            await peripheral.onConnect()
            if (Platform.OS === "ios") {
                await peripheral.onRequestMtu(MAX_iOS_MTU)
            } else if (requestMtu && requestMtu > 0) {
                await peripheral.onRequestMtu(requestMtu)
            }
            if (this.pendingDisconnections.get(peripheralIdentifier)) {
                peripheral.onDisconnect({ emit: true })
                errorConnectionFailed(peripheralIdentifier);
            }
            this.pendingDisconnections.delete(peripheralIdentifier)
            return peripheral
        } catch (error) {
            if (error instanceof SimulatedBleError)
                return error
            else {
                console.error(error)
                return new SimulatedBleError({
                    errorCode: BleErrorCode.UnknownError,
                    message: error
                })
            }
        }
    }

    async disconnect(
        adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string
    ): Promise<SimulatedBleError | undefined> {

        try {
            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            if (peripherals.get(peripheralIdentifier)?.isConnected) {
                await peripherals.get(peripheralIdentifier)?.onDisconnect({ emit: true })
            } else {
                this.pendingDisconnections.set(peripheralIdentifier, true)
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
        peripheralIdentifier: string): Promise<boolean | SimulatedBleError> {

        try {
            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfUnknown(peripherals, peripheralIdentifier)
            return peripherals.get(peripheralIdentifier)!.isConnected()
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