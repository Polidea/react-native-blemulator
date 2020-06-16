import { NativeModules, NativeEventEmitter, EmitterSubscription, EventSubscriptionVendor } from 'react-native';
import { ScanResult } from './scan-result'
import { SimulationManager } from './internal/simulation-manager';
import { SimulatedPeripheral } from './simulated-peripheral';
import { UUID } from './types';
import { SimulatedBleError } from './ble-error';

const blemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor = NativeModules.Blemulator;

const _METHOD_CALL_EVENT = "MethodCall"

interface BlemulatorModuleInterface {
    handleReturnCall(callbackId: String, returnValue: { value?: Object, error?: SimulatedBleError }): void
    addScanResult(scanResult: ScanResult): void
    simulate(): Promise<void>
}

interface MethodCallArguments {
    methodName: String
    callbackId: String
}

enum MethodName {
    START_SCAN = "startScan",
    STOP_SCAN = "stopScan",
}

class BlemulatorInstance {
    private emitterSubscription: EmitterSubscription;
    private manager: SimulationManager

    constructor() {
        this.manager = new SimulationManager()

        const emitter: NativeEventEmitter = new NativeEventEmitter(blemulatorModule)
        this.emitterSubscription = emitter.addListener(
            _METHOD_CALL_EVENT,
            (args: MethodCallArguments) => {
                console.log(`Requested method: ${args.methodName}`)
                switch (args.methodName) {
                    case MethodName.START_SCAN:
                        const scanArgs = args as MethodCallArguments & { filteredUuids?: Array<UUID>, scanMode?: number, callbackType?: number }
                        const error: SimulatedBleError | undefined = this.manager.startScan(scanArgs.filteredUuids, scanArgs.scanMode, scanArgs.callbackType,
                            (scanResult) => { blemulatorModule.addScanResult(scanResult) })
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
                        break
                    case MethodName.STOP_SCAN:
                        this.manager.stopScan()
                        blemulatorModule.handleReturnCall(args.callbackId, {})
                        break
                    default:
                        console.log("Uknown method requested")
                }
            },
        )
    }

    simulate(): Promise<void> {
        console.log(`Turn on simulation mode`) //TODO remove this before release
        return blemulatorModule.simulate()
    }

    addPeripheral(peripheral: SimulatedPeripheral): void {
        this.manager.addPeripheral(peripheral)
    }

    private test(callbackId: String) {
        console.log(`Handling call ${callbackId} in JS`)
        blemulatorModule.handleReturnCall(callbackId, { value: { testProperty: "test value" } })
    }
}

export interface Blemulator extends BlemulatorInstance { }

export const blemulator: Blemulator = new BlemulatorInstance()
