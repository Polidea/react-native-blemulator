import { EventSubscriptionVendor, NativeModules, EmitterSubscription, NativeEventEmitter } from "react-native";
import { SimulatedBleError } from "../ble-error";
import { ScanResult } from "../scan-result";
import { SimulationManager } from "./simulation-manager";
import { UUID, ConnectionState, AdapterState } from "../types";

const _METHOD_CALL_EVENT = "MethodCall"
interface BlemulatorModuleInterface {
    handleReturnCall(callbackId: String, returnValue: { value?: Object, error?: SimulatedBleError }): void
    addScanResult(scanResult: ScanResult): void
    publishConnectionState(peripheralId: string, connectionState: string): void
    publishAdapterState(state: String): void
    simulate(): Promise<void>
}

const blemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor = NativeModules.Blemulator;

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
    CREATE_CLIENT = "createClient",
    DESTROY_CLIENT = "destroyClient",
    ENABLE = "enable",
    DISABLE = "disable",
    GET_CURRENT_STATE = "getCurrentState"
}

export class Bridge {
    private emitterSubscription: EmitterSubscription;
    private manager: SimulationManager
    private blemulatorModule: BlemulatorModuleInterface

    constructor(manager: SimulationManager) {
        this.manager = manager
        this.blemulatorModule = blemulatorModule

        this.setupConnectionStatePublisher()

        const emitter: NativeEventEmitter = new NativeEventEmitter(blemulatorModule)
        this.emitterSubscription = emitter.addListener(
            _METHOD_CALL_EVENT,
            async (args: MethodCallArguments) => {
                console.log(`Requested method: ${args.methodName}`)
                let error: SimulatedBleError | undefined
                switch (args.methodName) {
                    case MethodName.CREATE_CLIENT:
                        this.manager.setAdapterStatePublisher((state: AdapterState) => { blemulatorModule.publishAdapterState(state) })
                        blemulatorModule.handleReturnCall(args.callbackId, {})
                        break
                    case MethodName.DESTROY_CLIENT:
                        this.manager.setAdapterStatePublisher()
                        blemulatorModule.handleReturnCall(args.callbackId, {})
                        break
                    case MethodName.ENABLE:
                        //TODO handle transactionId (store it in some object in the map to be able to flip it to cancelled)
                        error = await this.manager.enable()
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
                        break
                    case MethodName.DISABLE:
                        //TODO handle transactionId (store it in some object in the map to be able to flip it to cancelled)
                        error = await this.manager.disable()
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
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
                        const connectArgs = args as MethodCallArguments & {
                            arguments: {
                                identifier: string, isAutoConnect?: boolean, requestMtu?: number, refreshGatt?: boolean, timeout?: number
                            }
                        }
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

    simulate(): Promise<void> {
        return blemulatorModule.simulate()
    }

    private setupConnectionStatePublisher() {
        this.manager.setConnectionStatePublisher((id, state) => {
            let stateString: string

            switch (state) {
                case ConnectionState.CONNECTED:
                    stateString = "connected"
                    break
                case ConnectionState.CONNECTING:
                    stateString = "connecting"
                    break
                case ConnectionState.DISCONNECTED:
                    stateString = "disconnected"
                    break
                case ConnectionState.DISCONNECTING:
                    stateString = "disconnecting"
                    break
                default:
                    stateString = "unknown"
                    break
            }

            blemulatorModule.publishConnectionState(id, stateString)
        })
    }
}