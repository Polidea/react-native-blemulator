import { Base64, AdapterState, UUID, Subscription } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import {
    errorIfNotReadable,
    errorIfPeripheralDisconnected,
    errorIfCharacteristicNotFound,
    errorIfNotMonitorable,
    errorChecksForAccessToGatt,
    errorIfNotWritableWithResponse,
    errorIfNotWritableWithoutResponse,
    errorIfBluetoothNotSupported,
    errorIfBluetoothNotOn,
} from "../error_creator";
import { SimulatedCharacteristic } from "../../simulated-characteristic";
import { TransferCharacteristic, mapToTransferCharacteristic } from "../internal-types";
import { findPeripheralWithService, findPeripheralWithCharacteristic } from "../utils";

export class CharacteristicsDelegate {
    private readonly getAdapterState: () => AdapterState
    private notificationPublisher: (
        transactionId: string,
        characteristic: TransferCharacteristic | null, error?: SimulatedBleError
    ) => void = () => { }
    private notificationSubscriptions: Map<string, Subscription> = new Map()

    constructor(getAdapterState: () => AdapterState) {
        this.getAdapterState = getAdapterState
    }

    setNotificationPublisher(
        publisher: (
            transactionId: string,
            characteristic: TransferCharacteristic | null,
            error?: SimulatedBleError) => void
    ) {
        this.notificationPublisher = publisher
    }

    onNewTransaction(transactionId: string) {
        this.handlePotentialMonitoringCancellation(transactionId)
    }

    onAdapterStateChange(adapterState: AdapterState) {
        if (adapterState != AdapterState.POWERED_ON) {
            const error = new SimulatedBleError({
                errorCode:
                    adapterState === AdapterState.UNSUPPORTED
                        ? BleErrorCode.BluetoothUnsupported
                        : BleErrorCode.BluetoothResetting,
                message: 'Bluetooth state changed'
            })
            this.notificationSubscriptions.forEach((subscription, transactionId) => {
                this.notificationPublisher(transactionId, null, error)
                subscription.dispose()
                this.notificationSubscriptions.delete(transactionId)
            })
        }
    }

    async readCharacteristic(
        adapterState: AdapterState,
        peripherals: Array<SimulatedPeripheral>,
        characteristicIdentifier: number
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicIdentifier)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic
                = matchedPeripheral!.getCharacteristic(characteristicIdentifier)!

            return this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!
            )
        } catch (error) {
            return this.handleError(error)
        }
    }

    async readCharacteristicForService(
        adapterState: AdapterState,
        peripherals: Array<SimulatedPeripheral>,
        serviceIdentifier: number,
        characteristicUuid: UUID
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceIdentifier)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceIdentifier)?.getCharacteristicByUuid(characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)

            return this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!
            )
        } catch (error) {
            return this.handleError(error)
        }
    }

    async readCharacteristicForDevice(
        adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        serviceUuid: UUID,
        characteristicUuid: UUID
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined
                = peripherals.get(peripheralIdentifier)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined
                = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)

            return this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!
            )
        } catch (error) {
            return this.handleError(error)
        }
    }

    private async readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
        characteristic: SimulatedCharacteristic,
        peripheral: SimulatedPeripheral
    ): Promise<TransferCharacteristic> {

        errorIfNotReadable(characteristic!)
        const value: Base64 = await characteristic!.read()

        errorIfBluetoothNotSupported(this.getAdapterState())
        errorIfBluetoothNotOn(this.getAdapterState())
        errorIfPeripheralDisconnected(peripheral)

        const returnedCharacteristic: TransferCharacteristic
            = mapToTransferCharacteristic(characteristic!, peripheral.id, value)
        return returnedCharacteristic
    }

    async writeCharacteristic(peripherals: Array<SimulatedPeripheral>,
        characteristicIdentifier: number,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic
                = matchedPeripheral!.getCharacteristic(characteristicIdentifier)!

            return this.writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic,
                matchedPeripheral!,
                value, withResponse,
                transactionId
            )
        } catch (error) {
            return this.handleError(error)
        }
    }

    async writeCharacteristicForService(
        peripherals: Array<SimulatedPeripheral>,
        serviceIdentifier: number,
        characteristicUuid: UUID,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceIdentifier)?.getCharacteristicByUuid(characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)

            return this.writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!,
                value, withResponse,
                transactionId
            )
        } catch (error) {
            return this.handleError(error)
        }
    }

    async writeCharacteristicForDevice(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined
                = peripherals.get(peripheralIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined
                = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)

            return this.writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!,
                value, withResponse,
                transactionId
            )
        } catch (error) {
            return this.handleError(error)
        }
    }

    private async writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
        characteristic: SimulatedCharacteristic,
        peripheral: SimulatedPeripheral,
        value: Base64,
        withResponse: boolean,
        transactionId: string
    ): Promise<TransferCharacteristic> {
        if (withResponse) {
            errorIfNotWritableWithResponse(characteristic)
        } else {
            errorIfNotWritableWithoutResponse(characteristic)
        }

        await characteristic.write(value, { withResponse: withResponse, sendNotification: true })

        errorIfBluetoothNotSupported(this.getAdapterState())
        errorIfBluetoothNotOn(this.getAdapterState())
        errorIfPeripheralDisconnected(peripheral)

        return mapToTransferCharacteristic(characteristic, peripheral.id, value)
    }

    monitorCharacteristic(adapterState: AdapterState, peripherals: Array<SimulatedPeripheral>,
        characteristicId: number, transactionId: string
    ): void {
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicId)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic
                = matchedPeripheral!.getCharacteristic(characteristicId)!
            errorIfNotMonitorable(characteristic)

            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!)
        } catch (error) {
            this.handleMonitoringError(transactionId, error)
        }
    }

    monitorCharacteristicForService(adapterState: AdapterState, peripherals: Array<SimulatedPeripheral>,
        serviceId: number, characteristicUuid: UUID, transactionId: string
    ): void {
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceId)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceId)?.getCharacteristicByUuid(characteristicUuid)

            errorIfCharacteristicNotFound(characteristic)
            errorIfNotMonitorable(characteristic!)

            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!)
        } catch (error) {
            this.handleMonitoringError(transactionId, error)
        }
    }

    monitorCharacteristicForDevice(adapterState: AdapterState,
        peripherals: Map<string, SimulatedPeripheral>, peripheralId: string,
        serviceUuid: UUID, characteristicUuid: UUID, transactionId: string
    ): void {
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralId)

            errorChecksForAccessToGatt(adapterState, matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined
                = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfNotMonitorable(characteristic!)

            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!)
        } catch (error) {
            this.handleMonitoringError(transactionId, error)
        }
    }

    private handleError(error: any): SimulatedBleError {
        if (error instanceof SimulatedBleError) {
            return error
        } else {
            return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
        }
    }

    private handleSubscription(transactionId: string,
        matchedPeripheral: SimulatedPeripheral,
        characteristic: SimulatedCharacteristic
    ) {
        if (this.notificationSubscriptions.has(transactionId)) {
            //No cancellation error thrown here, since it was handled already in native
            this.notificationSubscriptions.get(transactionId)?.dispose()
            this.notificationSubscriptions.delete(transactionId)
        }

        const subscription: Subscription = characteristic.monitor((newValue) => {
            try {
                errorIfPeripheralDisconnected(matchedPeripheral!)
                this.notificationPublisher(
                    transactionId,
                    mapToTransferCharacteristic(characteristic, matchedPeripheral!.id, newValue)
                )
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
            this.notificationPublisher(transactionId, null,
                new SimulatedBleError(
                    { errorCode: BleErrorCode.UnknownError, message: error }
                )
            )
        }

        this.notificationSubscriptions.get(transactionId)?.dispose()
        this.notificationSubscriptions.delete(transactionId)
    }

    private handlePotentialMonitoringCancellation(transactionId: string) {
        if (this.notificationSubscriptions.has(transactionId)) {
            this.notificationSubscriptions.get(transactionId)?.dispose()
            this.notificationPublisher(transactionId, null,
                new SimulatedBleError(
                    { errorCode: BleErrorCode.OperationCancelled, message: "Transaction replaced" }
                )
            )
            this.notificationSubscriptions.delete(transactionId)
        }
    }
}
