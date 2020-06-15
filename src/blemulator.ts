import { NativeModules, NativeEventEmitter, EmitterSubscription, EventSubscriptionVendor } from 'react-native';
import { ScanResult } from './scan-result'
import { SimulationManager } from './simulation-manager';
import { SimulatedPeripheral } from './simulated-peripheral';

const blemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor = NativeModules.Blemulator;

const _METHOD_CALL_EVENT = "MethodCall"

interface BlemulatorModuleInterface {
    runTest(): void
    handleReturnCall(callbackId: String, jsonString: Object): void
    sampleMethod(stringArgument: String, numberArgument: Number, callback: (arg: String) => void): void
    addScanResult(scanResult: ScanResult): void
    simulate(): Promise<void>
}

interface MethodCallArguments {
    methodName: String
    callbackId: String
}

enum MethodName {
    TEST = "test",
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
                    case MethodName.TEST:
                        this.test(args.callbackId)
                        break
                    case MethodName.START_SCAN:
                        //TODO handle params #12
                        this.manager.startScan((scanResult) => { blemulatorModule.addScanResult(scanResult) })
                        blemulatorModule.handleReturnCall(args.callbackId, {})
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

    runNativeToJsCommunicationTest() {
        blemulatorModule.runTest()
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
        blemulatorModule.handleReturnCall(callbackId, { testProperty: "test value" })
    }
}

export interface Blemulator extends BlemulatorInstance {}

export const blemulator: Blemulator = new BlemulatorInstance()
