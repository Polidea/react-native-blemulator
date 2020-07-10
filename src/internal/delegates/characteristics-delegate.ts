import { Base64, AdapterState, UUID, Subscription } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfPeripheralNotFound, errorIfPeripheralNotConnected, errorIfNotReadable, errorIfDiscoveryNotDone, errorIfPeripheralDisconnected, errorIfCharacteristicNotFound, errorIfNotMonitorable, errorIfNotConnected, errorIfBluetoothNotSupported, errorIfBluetoothNotOn } from "../error_creator";
import { SimulatedCharacteristic } from "../../simulated-characteristic";
import { TransferCharacteristic, mapToTransferCharacteristic } from "../internal-types";

export class CharacteristicsDelegate {
    private notificationPublisher: (transactionId: string, characteristic: TransferCharacteristic | null, error?: SimulatedBleError) => void = () => { }
    private notificationSubscriptions: Map<string, Subscription> = new Map()

    setNotificationPublisher(publisher: (transactionId: string, characteristic: TransferCharacteristic | null, error?: SimulatedBleError) => void) {
        this.notificationPublisher = publisher
    }

    onNewTransaction(transactionId: string) {
        this.handlePotentialMonitoringCancellation(transactionId)
    }

    async readCharacteristic(adapterState: AdapterState,
        peripherals: Array<SimulatedPeripheral>,
        characteristicIdentifier: number): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null = null
            for (let i = 0; i < peripherals.length; i++) {
                if (peripherals[i].getCharacteristic(characteristicIdentifier) != null) {
                    matchedPeripheral = peripherals[i];
                    break
                }
            }

            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic = matchedPeripheral!.getCharacteristic(characteristicIdentifier)!
            errorIfNotReadable(characteristic)
            const value: Base64 = await characteristic.read()

            errorIfPeripheralDisconnected(matchedPeripheral!)
            const returnedCharacteristic: TransferCharacteristic = mapToTransferCharacteristic(characteristic, matchedPeripheral!.id, value)
            return returnedCharacteristic
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }

    async readCharacteristicForService(adapterState: AdapterState,
        peripherals: Array<SimulatedPeripheral>,
        serviceIdentifier: number,
        characteristicUuid: UUID): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null = null
            for (let i = 0; i < peripherals.length; i++) {
                if (peripherals[i].getService(serviceIdentifier) != null) {
                    matchedPeripheral = peripherals[i];
                    break
                }
            }

            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceIdentifier)?.getCharacteristicByUuid(characteristicUuid)

            errorIfCharacteristicNotFound(characteristic)
            errorIfNotReadable(characteristic!)
            const value: Base64 = await characteristic!.read()

            errorIfPeripheralDisconnected(matchedPeripheral!)
            const returnedCharacteristic: TransferCharacteristic = mapToTransferCharacteristic(characteristic!, matchedPeripheral!.id, value)
            return returnedCharacteristic
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }

    async readCharacteristicForDevice(adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        serviceUuid: UUID,
        characteristicUuid: UUID): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralIdentifier)

            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic | undefined = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfNotReadable(characteristic!)
            const value: Base64 = await characteristic!.read()

            errorIfPeripheralDisconnected(matchedPeripheral!)
            const returnedCharacteristic: TransferCharacteristic = mapToTransferCharacteristic(characteristic!, matchedPeripheral!.id, value)
            return returnedCharacteristic
        } catch (error) {
            if (error instanceof SimulatedBleError) {
                return error
            } else {
                return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
            }
        }
    }

    monitorCharacteristic(adapterState: AdapterState, peripherals: Array<SimulatedPeripheral>,
        characteristicId: number, transactionId: string): void {
        try {
            let matchedPeripheral: SimulatedPeripheral | null = null
            for (let i = 0; i < peripherals.length; i++) {
                if (peripherals[i].getCharacteristic(characteristicId) != null) {
                    matchedPeripheral = peripherals[i];
                    break
                }
            }

            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic = matchedPeripheral!.getCharacteristic(characteristicId)!
            errorIfNotMonitorable(characteristic)

            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!)
        } catch (error) {
            this.handleMonitoringError(transactionId, error)
        }
    }

    monitorCharacteristicForService(adapterState: AdapterState, peripherals: Array<SimulatedPeripheral>,
        serviceId: number, characteristicUuid: UUID, transactionId: string): void {
        try {
            let matchedPeripheral: SimulatedPeripheral | null = null
            for (let i = 0; i < peripherals.length; i++) {
                if (peripherals[i].getService(serviceId) != null) {
                    matchedPeripheral = peripherals[i];
                    break
                }
            }

            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceId)?.getCharacteristicByUuid(characteristicUuid)

            errorIfCharacteristicNotFound(characteristic)
            errorIfNotMonitorable(characteristic!)


            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!)
        } catch (error) {
            this.handleMonitoringError(transactionId, error)
        }
    }

    monitorCharacteristicForDevice(adapterState: AdapterState, peripherals: Map<string, SimulatedPeripheral>, peripheralId: string,
        serviceUuid: UUID, characteristicUuid: UUID, transactionId: string): void {
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralId)

            errorIfBluetoothNotSupported(adapterState)
            errorIfBluetoothNotOn(adapterState)
            errorIfPeripheralNotFound(matchedPeripheral)
            errorIfPeripheralNotConnected(matchedPeripheral!)
            errorIfDiscoveryNotDone(matchedPeripheral!)

            let characteristic: SimulatedCharacteristic | undefined = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfNotMonitorable(characteristic!)

            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!)
        } catch (error) {
            this.handleMonitoringError(transactionId, error)
        }
    }

    private handleSubscription(transactionId: string, matchedPeripheral: SimulatedPeripheral, characteristic: SimulatedCharacteristic) {
        if (this.notificationSubscriptions.has(transactionId)) {
            //No cancellation error thrown here, since it was handled already in native
            this.notificationSubscriptions.get(transactionId)?.dispose()
            this.notificationSubscriptions.delete(transactionId)
        }

        const subscription: Subscription = characteristic.monitor((newValue) => {
            try {
                errorIfPeripheralDisconnected(matchedPeripheral!)
                this.notificationPublisher(transactionId, mapToTransferCharacteristic(characteristic, matchedPeripheral!.id, newValue))
            } catch (error) {
                this.handleMonitoringError(transactionId, error)
            }
        }, { setNotifying: true })
        this.notificationSubscriptions.set(transactionId, subscription)
    }

    private handleMonitoringError(transactionId: string, error: any) {
        if (error instanceof SimulatedBleError) {
            this.notificationPublisher(transactionId, null, error)
        } else {
            this.notificationPublisher(transactionId, null, new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error }))
        }

        this.notificationSubscriptions.get(transactionId)?.dispose
        this.notificationSubscriptions.delete(transactionId)
    }

    private handlePotentialMonitoringCancellation(transactionId: string) {
        if (this.notificationSubscriptions.has(transactionId)) {
            this.notificationSubscriptions.get(transactionId)?.dispose()
            this.notificationPublisher(transactionId, null, new SimulatedBleError({ errorCode: BleErrorCode.OperationCancelled, message: "Transaction replaced" }))
            this.notificationSubscriptions.delete(transactionId)
        }
    }
}