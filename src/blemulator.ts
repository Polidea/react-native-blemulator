import { SimulationManager } from './internal/simulation-manager';
import { SimulatedPeripheral } from './simulated-peripheral';
import { Bridge } from './internal/bridge';

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
}

export interface Blemulator extends BlemulatorInstance { }

export const blemulator: Blemulator = new BlemulatorInstance()
