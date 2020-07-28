import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfUnknown, errorIfConnected, errorIfBluetoothNotOn, errorConnectionFailed, errorIfBluetoothNotSupported, errorIfPeripheralNotConnected, errorIfPeripheralDisconnected } from "../error_creator";
import { AdapterState, ConnectionState, Subscription } from "../../types";
import { Platform } from 'react-native';
import { MAX_iOS_MTU } from './mtu-delegate'
import { mapErrorToSimulatedBleError } from "../utils";


export class ConnectionDelegate {
    private connectionStatePublisher: ((id: string, state: ConnectionState) => void) | undefined = undefined
    private connectionStateSubscriptions: Map<string, Subscription> = new Map()
    private pendingDisconnections: Map<string, boolean> = new Map()
    private getAdapterState: () => AdapterState

    constructor(getAdapterState: () => AdapterState) {
        this.getAdapterState = getAdapterState
    }

    onAdapterStateChanged(adapterState: AdapterState, peripherals: Map<string, SimulatedPeripheral>) {
        if (adapterState !== AdapterState.POWERED_ON) {
            this.connectionStateSubscriptions.forEach((subscription, peripheralId) => {
                peripherals.get(peripheralId)?.onDisconnect({ emit: true })
            })
        }
    }

    setConnectionStatePublisher(publisher: (id: string, state: ConnectionState) => void) {
        this.connectionStatePublisher = publisher
    }

    async connect(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        requestMtu?: number
    ): Promise<SimulatedBleError | SimulatedPeripheral> {
        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfConnected(peripherals, peripheralIdentifier)
            const peripheral: SimulatedPeripheral = peripherals.get(peripheralIdentifier)!
            this.pendingDisconnections.set(peripheralIdentifier, false)

            this.handleConnectionStateSubscription(peripheral)

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

            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())

            return peripheral
        } catch (error) {
            if (peripherals.get(peripheralIdentifier)?.isConnected()) {
                peripherals.get(peripheralIdentifier)?.onDisconnect()
            }
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

    private handleConnectionStateSubscription(peripheral: SimulatedPeripheral) {
        const subscription = peripheral.listenToConnectionStateChanges((state) => {
            if (this.connectionStatePublisher) {
                this.connectionStatePublisher(peripheral.id, state)
            }

            if (state === ConnectionState.DISCONNECTED) {
                subscription.dispose()
                this.connectionStateSubscriptions.delete(peripheral.id)
            }
        })

        this.connectionStateSubscriptions.set(peripheral.id, subscription)
    }

    async disconnect(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string
    ): Promise<SimulatedBleError | undefined> {

        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
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

    async isConnected(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string
    ): Promise<boolean | SimulatedBleError> {
        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
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

    async requestConnectionPriority(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralId: string,
        connectionPriority: number,
        transactionId: string
    ): Promise<SimulatedBleError | SimulatedPeripheral> {
        try {
            const peripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralId)

            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfUnknown(peripherals, peripheralId)
            errorIfPeripheralNotConnected(peripheral!)

            if (Platform.OS === 'android') {
                await peripheral!.onConnectionPriorityRequested(connectionPriority)
            }

            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfPeripheralDisconnected(peripheral!)
            return peripheral!
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        }
    }
}
