import { SimulatedBleError } from "../../ble-error";
import { SimulatedPeripheral } from "../../simulated-peripheral";
import { errorIfUnknown, errorIfNotConnected, errorIfBluetoothNotOn, errorIfMtuNegotiated, errorIfBluetoothNotSupported, errorIfOperationCancelled } from "../error_creator";
import { AdapterState } from "../../types";
import { Platform } from 'react-native';
import { mapErrorToSimulatedBleError } from "../utils";
import { TransactionMonitor } from "../transaction-monitor";

export const DEFAULT_MTU = 23
export const MIN_MTU = 23
export const MAX_iOS_MTU: number = 185
export const MAX_MTU = 512

export class MtuDelegate {
    private transactionMonitor: TransactionMonitor
    private getAdapterState: () => AdapterState

    constructor(getAdapterState: () => AdapterState, transactionMonitor: TransactionMonitor) {
        this.getAdapterState = getAdapterState
        this.transactionMonitor = transactionMonitor
    }

    async requestMtu(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        mtu: number,
        transactionId: string
    ): Promise<SimulatedBleError | number> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfNotConnected(peripherals, peripheralIdentifier)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, { peripheralId: peripheralIdentifier })
            
            let negotiatedMtu: number
            if (Platform.OS === "ios") {
                negotiatedMtu = peripherals.get(peripheralIdentifier)!.getMtu()
            } else {
                errorIfMtuNegotiated(peripherals, peripheralIdentifier)
                negotiatedMtu = await peripherals.get(peripheralIdentifier)!.onRequestMtu(mtu)
            }

            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfNotConnected(peripherals, peripheralIdentifier)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, { peripheralId: peripheralIdentifier })
            return negotiatedMtu
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }
}
