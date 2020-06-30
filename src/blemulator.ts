import { SimulationManager } from './internal/simulation-manager';
import { SimulatedPeripheral } from './simulated-peripheral';
import { Bridge } from './internal/bridge';
import { AdapterState } from './types';

class BlemulatorInstance {
    private bridge: Bridge
    private manager: SimulationManager

    constructor() {
        this.manager = new SimulationManager()
        this.bridge = new Bridge(this.manager)
    }

    simulate(): Promise<void> {
        console.log(`Turn on simulation mode`) //TODO remove this before release
        return this.bridge.simulate()
    }

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.manager.addPeripheral(peripheral)
    }

    setSimulatedAdapterState(adapterState: AdapterState) {
        this.manager.setAdapterState(adapterState)
    }

    getSimulatedAdapterState(): AdapterState {
        return this.manager.getAdapterState()
    }

    setAdapterStateChangeDelay(delay?: number) {
        this.manager.setAdapterStateChangeDelay(delay)
    }
}

export interface Blemulator extends BlemulatorInstance { }

export const blemulator: Blemulator = new BlemulatorInstance()
