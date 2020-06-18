import { NativeModules, EventSubscriptionVendor } from 'react-native';
import { ScanResult } from './scan-result'
import { SimulationManager } from './internal/simulation-manager';
import { SimulatedPeripheral } from './simulated-peripheral';
import { SimulatedBleError } from './ble-error';
import { Bridge } from './internal/bridge';

export interface BlemulatorModuleInterface {
    handleReturnCall(callbackId: String, returnValue: { value?: Object, error?: SimulatedBleError }): void
    addScanResult(scanResult: ScanResult): void
    simulate(): Promise<void>
}

const blemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor = NativeModules.Blemulator;

class BlemulatorInstance {
    private bridge: Bridge
    private manager: SimulationManager

    constructor() {
        this.manager = new SimulationManager()
        this.bridge = new Bridge(blemulatorModule, this.manager)
    }

    simulate(): Promise<void> {
        console.log(`Turn on simulation mode`) //TODO remove this before release
        return blemulatorModule.simulate()
    }

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.manager.addPeripheral(peripheral)
    }
}

export interface Blemulator extends BlemulatorInstance { }

export const blemulator: Blemulator = new BlemulatorInstance()
