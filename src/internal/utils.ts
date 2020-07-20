import { SimulatedPeripheral } from "../simulated-peripheral";
import { SimulatedBleError, BleErrorCode } from "../ble-error";

let id = 0
export const IdGenerator = {
    nextId() {
        return id++
    }
}

export function delay(delay: number): Promise<void> { 
    return new Promise((resolve) => setTimeout(resolve, delay))
}

export function findPeripheralWithDescriptor(peripherals: Array<SimulatedPeripheral>, descriptorId: number): SimulatedPeripheral | null {
    for (let i = 0; i < peripherals.length; i++) {
        if (peripherals[i].getDescriptor(descriptorId) != null) {
            return peripherals[i]
        }
    }
    return null
}

export function findPeripheralWithCharacteristic(peripherals: Array<SimulatedPeripheral>, characteristicIdentifier: number): SimulatedPeripheral | null {
    for (let i = 0; i < peripherals.length; i++) {
        if (peripherals[i].getCharacteristic(characteristicIdentifier) != null) {
            return peripherals[i]
        }
    }
    return null
}

export function findPeripheralWithService(peripherals: Array<SimulatedPeripheral>, serviceIdentifier: number): SimulatedPeripheral | null {
    for (let i = 0; i < peripherals.length; i++) {
        if (peripherals[i].getService(serviceIdentifier) != null) {
            return peripherals[i]
        }
    }
    return null
}

export function mapErrorToSimulatedBleError(error: any): SimulatedBleError {
    if (error instanceof SimulatedBleError) {
        return error
    } else {
        return new SimulatedBleError({ errorCode: BleErrorCode.UnknownError, message: error })
    }
}
