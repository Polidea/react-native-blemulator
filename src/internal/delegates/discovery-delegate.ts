import { SimulatedPeripheral } from "../../simulated-peripheral";
import { AdapterState } from "../../types";
import { SimulatedBleError } from "../../ble-error";
import { SimulatedService } from "../../simulated-service";
import { errorIfBluetoothNotOn, errorIfUnknown, errorIfNotConnected, errorIfDisconnected, errorIfBluetoothNotSupported, errorIfOperationCancelled } from "../error_creator";
import { mapErrorToSimulatedBleError } from "../utils";
import { TransactionMonitor } from "../transaction-monitor";

export class DiscoveryDelegate {
    private transactionMonitor: TransactionMonitor
    private getAdapterState: () => AdapterState

    constructor(getAdapterState: () => AdapterState, transactionMonitor: TransactionMonitor) {
        this.getAdapterState = getAdapterState
        this.transactionMonitor = transactionMonitor
    }

    async discovery(
        peripherals: Map<string, SimulatedPeripheral>,
        peripheralIdentifier: string,
        transactionId: string,
    ): Promise<SimulatedBleError | Array<SimulatedService>> {
        const internalId = this.transactionMonitor.registerTransaction(transactionId)
        try {
            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfUnknown(peripherals, peripheralIdentifier)
            errorIfNotConnected(peripherals, peripheralIdentifier)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, { peripheralId: peripheralIdentifier })

            await peripherals.get(peripheralIdentifier)?.onDiscovery()

            errorIfBluetoothNotSupported(this.getAdapterState())
            errorIfBluetoothNotOn(this.getAdapterState())
            errorIfDisconnected(peripherals, peripheralIdentifier)
            errorIfOperationCancelled(transactionId, internalId, this.transactionMonitor, { peripheralId: peripheralIdentifier })
            return peripherals.get(peripheralIdentifier)!.getServices()
        } catch (error) {
            return mapErrorToSimulatedBleError(error)
        } finally {
            this.transactionMonitor.clearTransaction(transactionId, internalId)
        }
    }
}
