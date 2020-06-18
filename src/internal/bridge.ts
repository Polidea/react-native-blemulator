import { EventSubscriptionVendor, NativeModules, EmitterSubscription, NativeEventEmitter } from "react-native";
import { SimulatedBleError } from "../ble-error";
import { ScanResult } from "../scan-result";
import { SimulationManager } from "./simulation-manager";
import { UUID } from "../types";
import { BlemulatorModuleInterface } from "../blemulator";

const _METHOD_CALL_EVENT = "MethodCall"

interface MethodCallArguments {
    methodName: String
    callbackId: String
    arguments: Object
}

enum MethodName {
    START_SCAN = "startScan",
    STOP_SCAN = "stopScan",
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    DESTROY_CLIENT = "destroyClient"
}

export class Bridge {
    private emitterSubscription: EmitterSubscription;
    private manager: SimulationManager
    private blemulatorModule: BlemulatorModuleInterface

    constructor(blemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor, manager: SimulationManager) {
        this.manager = manager
        this.blemulatorModule = blemulatorModule

        const emitter: NativeEventEmitter = new NativeEventEmitter(blemulatorModule)
        this.emitterSubscription = emitter.addListener(
            _METHOD_CALL_EVENT,
            async (args: MethodCallArguments) => {
                console.log(`Requested method: ${args.methodName}`)
                let error: SimulatedBleError | undefined
                switch (args.methodName) {
                    case MethodName.DESTROY_CLIENT:
                        emitter.removeSubscription(this.emitterSubscription)
                        break
                    case MethodName.START_SCAN:
                        const scanArgs = args as MethodCallArguments & { arguments: { filteredUuids?: Array<UUID>, scanMode?: number, callbackType?: number } }
                        error = this.manager.startScan(scanArgs.arguments.filteredUuids, scanArgs.arguments.scanMode, scanArgs.arguments.callbackType,
                            (scanResult) => { blemulatorModule.addScanResult(scanResult) })
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
                        break
                    case MethodName.STOP_SCAN:
                        this.manager.stopScan()
                        blemulatorModule.handleReturnCall(args.callbackId, {})
                        break
                    case MethodName.CONNECT:
                        const connectArgs = args as MethodCallArguments & { arguments: {
                            identifier: string, isAutoConnect?: boolean, requestMtu?: number, refreshGatt?: boolean, timeout?: number
                        }}
                        error = await this.manager.connect(connectArgs.arguments.identifier)
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
                        break
                    case MethodName.DISCONNECT:
                        const disconnectArgs = args as MethodCallArguments & { arguments: { identifier: string } }
                        error = await this.manager.disconnect(disconnectArgs.arguments.identifier)
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
                        break
                    default:
                        console.log("Uknown method requested")
                }
            },
        )
    }
}