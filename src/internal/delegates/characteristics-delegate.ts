import { Base64, AdapterState, UUID, Subscription } from "../../types";
import { SimulatedBleError, BleErrorCode } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import {
    errorIfCharacteristicNotReadable,
    errorIfPeripheralDisconnected,
    errorIfCharacteristicNotFound,
    errorIfNotMonitorable,
    errorChecksForAccessToGatt,
    errorIfNotWritableWithResponse,
    errorIfNotWritableWithoutResponse,
    errorChecksAfterOperation,
    errorIfPayloadTooLarge,
    errorIfPayloadMalformed,
    errorIfOperationCancelled,
} from "../error_creator";
import { SimulatedCharacteristic } from "../../simulated-characteristic";
import { TransferCharacteristic, mapToTransferCharacteristic } from "../internal-types";
import { findPeripheralWithService, findPeripheralWithCharacteristic, mapErrorToSimulatedBleError, trimValueToMtu } from "../utils";
import { MAX_MTU } from "./mtu-delegate";
import { TransactionMonitor } from "../transaction-monitor";

export class CharacteristicsDelegate {
    private readonly getAdapterState: () => AdapterState
    private notificationPublisher: (
        transactionId: string,
        characteristic: TransferCharacteristic | null, error?: SimulatedBleError
    ) => void = () => { }
    private notificationSubscriptions: Map<string, { subscription: Subscription, internalTransactionId: number }> = new Map()
    private transactionMonitor: TransactionMonitor

    constructor(getAdapterState: () => AdapterState, transactionMonitor: TransactionMonitor) {
        this.getAdapterState = getAdapterState
        this.transactionMonitor = transactionMonitor
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

    onAdapterStateChanged(adapterState: AdapterState) {
        if (adapterState != AdapterState.POWERED_ON) {
            const error = new SimulatedBleError({
                errorCode:
                    adapterState === AdapterState.UNSUPPORTED
                        ? BleErrorCode.BluetoothUnsupported
                        : BleErrorCode.BluetoothResetting,
                message: 'Bluetooth state changed'
            })
            this.notificationSubscriptions.forEach((subscriptionHolder, transactionId) => {
                this.notificationPublisher(transactionId, null, error)
                subscriptionHolder?.subscription.dispose()
                this.notificationSubscriptions.delete(transactionId)
            })
        }
    }

    async readCharacteristic(
        peripherals: Array<SimulatedPeripheral>,
        characteristicIdentifier: number,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic
                = matchedPeripheral!.getCharacteristic(characteristicIdentifier)!

            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })

            return await this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!,
                transactionId,
                internalId
            )
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async readCharacteristicForService(
        peripherals: Array<SimulatedPeripheral>,
        serviceIdentifier: number,
        characteristicUuid: UUID,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceIdentifier)?.getCharacteristicByUuid(characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            return await this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!,
                transactionId,
                internalId
            )
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    async readCharacteristicForDevice(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        transactionId: string
    ): Promise<TransferCharacteristic | SimulatedBleError> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined
                = peripherals.get(peripheralIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined
                = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            return await this.readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!,
                transactionId,
                internalId
            )
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    private async readAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
        characteristic: SimulatedCharacteristic,
        peripheral: SimulatedPeripheral,
        transactionId: string,
        internalTransactionId: number
    ): Promise<TransferCharacteristic> {

        errorIfCharacteristicNotReadable(characteristic!)
        const value: Base64 = await characteristic!.read()

        errorChecksAfterOperation(this.getAdapterState(), peripheral)
        errorIfPayloadTooLarge(
            value,
            MAX_MTU,
            BleErrorCode.CharacteristicReadFailed, {
            characteristicUuid: characteristic.uuid
        })
        errorIfPayloadMalformed(value)

        errorIfOperationCancelled(transactionId, internalTransactionId, this.transactionMonitor, {
            peripheralId: peripheral?.id,
            serviceUuid: characteristic?.service?.uuid,
            characteristicUuid: characteristic?.uuid
        })

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
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic
                = matchedPeripheral!.getCharacteristic(characteristicIdentifier)!
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            return await this.writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic,
                matchedPeripheral!,
                value, withResponse,
                transactionId,
                internalId
            )
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
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
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceIdentifier)?.getCharacteristicByUuid(characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            return await this.writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!,
                value, withResponse,
                transactionId,
                internalId
            )
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
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
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined
                = peripherals.get(peripheralIdentifier)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined
                = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            return await this.writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
                characteristic!,
                matchedPeripheral!,
                value, withResponse,
                transactionId,
                internalId
            )
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }

    private async writeAndMapCharacteristicWithCheckForReadabilityAndDisconnection(
        characteristic: SimulatedCharacteristic,
        peripheral: SimulatedPeripheral,
        value: Base64,
        withResponse: boolean,
        transactionId: string,
        internalTransactionId: number
    ): Promise<TransferCharacteristic> {
        if (withResponse) {
            errorIfNotWritableWithResponse(characteristic)
        } else {
            errorIfNotWritableWithoutResponse(characteristic)
        }

        errorIfPayloadTooLarge(
            value,
            MAX_MTU,
            BleErrorCode.CharacteristicWriteFailed, {
            characteristicUuid: characteristic.uuid
        })
        errorIfPayloadMalformed(value)
        await characteristic.write(value, { withResponse: withResponse, sendNotification: true })

        errorChecksAfterOperation(this.getAdapterState(), peripheral)

        errorIfOperationCancelled(transactionId, internalTransactionId, this.transactionMonitor, {
            peripheralId: peripheral?.id,
            serviceUuid: characteristic?.service?.uuid,
            characteristicUuid: characteristic?.uuid
        })

        return mapToTransferCharacteristic(characteristic, peripheral.id, value)
    }

    monitorCharacteristic(
        peripherals: Array<SimulatedPeripheral>,
        characteristicId: number,
        transactionId: string
    ): void {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithCharacteristic(peripherals, characteristicId)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic
                = matchedPeripheral!.getCharacteristic(characteristicId)!
            errorIfNotMonitorable(characteristic)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!, internalId)
        } catch (error) {
            this.handleMonitoringError(transactionId, error, internalId)
        }
    }

    monitorCharacteristicForService(
        peripherals: Array<SimulatedPeripheral>,
        serviceId: number,
        characteristicUuid: UUID,
        transactionId: string
    ): void {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | null
                = findPeripheralWithService(peripherals, serviceId)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined =
                matchedPeripheral!.getService(serviceId)?.getCharacteristicByUuid(characteristicUuid)

            errorIfCharacteristicNotFound(characteristic)
            errorIfNotMonitorable(characteristic!)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!, internalId)
        } catch (error) {
            this.handleMonitoringError(transactionId, error, internalId)
        }
    }

    monitorCharacteristicForDevice(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralId: string,
        serviceUuid: UUID,
        characteristicUuid: UUID,
        transactionId: string
    ): void {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            let matchedPeripheral: SimulatedPeripheral | undefined = peripherals.get(peripheralId)

            errorChecksForAccessToGatt(this.getAdapterState(), matchedPeripheral)

            let characteristic: SimulatedCharacteristic | undefined
                = matchedPeripheral!.getCharacteristicForService(serviceUuid, characteristicUuid)
            errorIfCharacteristicNotFound(characteristic)
            errorIfNotMonitorable(characteristic!)

            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, {
                peripheralId: matchedPeripheral?.id,
                serviceUuid: characteristic?.service?.uuid,
                characteristicUuid: characteristic?.uuid
            })
            this.handleSubscription(transactionId, matchedPeripheral!, characteristic!, internalId)
        } catch (error) {
            this.handleMonitoringError(transactionId, error, internalId)
        }
    }

    private handleSubscription(transactionId: string,
        matchedPeripheral: SimulatedPeripheral,
        characteristic: SimulatedCharacteristic,
        internalTransactionId: number
    ) {
        if (this.notificationSubscriptions.has(transactionId)) {
            //No cancellation error thrown here, since it was handled already in native
            this.notificationSubscriptions.get(transactionId)?.subscription?.dispose()
            this.notificationSubscriptions.delete(transactionId)
        }

        const subscription: Subscription = characteristic.monitor((newValue) => {
            try {
                errorIfPeripheralDisconnected(matchedPeripheral!)
                errorIfOperationCancelled(transactionId, internalTransactionId, this.transactionMonitor, {
                    peripheralId: matchedPeripheral?.id,
                    serviceUuid: characteristic?.service?.uuid,
                    characteristicUuid: characteristic?.uuid
                })
                errorIfPayloadTooLarge(
                    newValue,
                    matchedPeripheral.getMtu() - 3,
                    BleErrorCode.DescriptorReadFailed, {
                    characteristicUuid: characteristic.uuid,
                    noError: true,
                })
                const trimmedNotification = trimValueToMtu(newValue, matchedPeripheral.getMtu() - 3)
                errorIfPayloadMalformed(trimmedNotification)
                this.notificationPublisher(
                    transactionId,
                    mapToTransferCharacteristic(
                        characteristic,
                        matchedPeripheral!.id,
                        trimmedNotification
                    )
                )
            } catch (error) {
                this.handleMonitoringError(transactionId, error, internalTransactionId)
            }
        }, { setNotifying: true })
        this.notificationSubscriptions.set(transactionId, { subscription: subscription, internalTransactionId: internalTransactionId })
    }

    private handleMonitoringError(transactionId: string, error: any, internalTransactionId: number) {
        if (error instanceof SimulatedBleError) {
            this.notificationPublisher(transactionId, null, error)
        } else {
            this.notificationPublisher(transactionId, null,
                new SimulatedBleError(
                    { errorCode: BleErrorCode.UnknownError, message: error }
                )
            )
        }
        this.transactionMonitor.clearTransaction(transactionId, internalTransactionId)
        this.notificationSubscriptions.get(transactionId)?.subscription?.dispose()
        this.notificationSubscriptions.delete(transactionId)
    }

    private handlePotentialMonitoringCancellation(transactionId: string) {
        if (this.notificationSubscriptions.has(transactionId)) {
            this.notificationSubscriptions.get(transactionId)?.subscription?.dispose()
            this.notificationPublisher(transactionId, null,
                new SimulatedBleError(
                    { errorCode: BleErrorCode.OperationCancelled, message: "Transaction replaced" }
                )
            )
            this.transactionMonitor.clearTransaction(transactionId, this.notificationSubscriptions.get(transactionId)!.internalTransactionId)
            this.notificationSubscriptions.delete(transactionId)
        }
    }
}
