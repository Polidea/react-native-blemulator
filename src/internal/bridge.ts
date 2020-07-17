import { EventSubscriptionVendor, NativeModules, EmitterSubscription, NativeEventEmitter } from "react-native";
import { SimulatedBleError } from "../ble-error";
import { ScanResult } from "../scan-result";
import { SimulationManager } from "./simulation-manager";
import { UUID, ConnectionState, AdapterState, Base64 } from "../types";
import { SimulatedService } from "../simulated-service";
import { TransferCharacteristic, mapToTransferService } from "./internal-types";

const _METHOD_CALL_EVENT = "MethodCall"
interface BlemulatorModuleInterface {
    handleReturnCall(callbackId: string, returnValue: { value?: Object, error?: SimulatedBleError }): void
    addScanResult(scanResult: ScanResult): void
    publishConnectionState(peripheralId: string, connectionState: string): void
    publishAdapterState(state: String): void
    publishCharacteristicNotification(transactionId: string, characteristic: TransferCharacteristic | null, error: SimulatedBleError | null): void
    simulate(): Promise<void>
}

const blemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor = NativeModules.Blemulator;

interface MethodCallArguments {
    methodName: string
    callbackId: string
    arguments: Object
}

enum MethodName {
    CREATE_CLIENT = "createClient",
    DESTROY_CLIENT = "destroyClient",
    ENABLE = "enable",
    DISABLE = "disable",
    GET_CURRENT_STATE = "getCurrentState",
    START_SCAN = "startScan",
    STOP_SCAN = "stopScan",
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    IS_DEVICE_CONNECTED = "isDeviceConnected",
    REQUEST_MTU = "requestMtu",
    DISCOVERY = "discovery",
    READ_CHARACTERISTIC = "readCharacteristic",
    READ_CHARACTERISTIC_FOR_SERVICE = "readCharacteristicForService",
    READ_CHARACTERISTIC_FOR_DEVICE = "readCharacteristicForDevice",
    WRITE_CHARACTERISTIC = "writeCharacteristic",
    WRITE_CHARACTERISTIC_FOR_SERVICE = "writeCharacteristicForService",
    WRITE_CHARACTERISTIC_FOR_DEVICE = "writeCharacteristicForDevice",
    MONITOR_CHARACTERISTIC = "monitorCharacteristic",
    MONITOR_CHARACTERISTIC_FOR_SERVICE = "monitorCharacteristicForService",
    MONITOR_CHARACTERISTIC_FOR_DEVICE = "monitorCharacteristicForDevice",
}

export class Bridge {
    private emitterSubscription: EmitterSubscription;
    private manager: SimulationManager
    private blemulatorModule: BlemulatorModuleInterface

    constructor(manager: SimulationManager) {
        this.manager = manager
        this.blemulatorModule = blemulatorModule

        this.setupConnectionStatePublisher()
        this.manager.setNotificationPublisher((transactionId, characteristic, error) => {
            blemulatorModule.publishCharacteristicNotification(transactionId, characteristic, error ? error : null)
        })

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
                        error = await this.manager.connect(connectArgs.arguments.identifier, connectArgs.arguments.requestMtu)
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
                        break
                    case MethodName.DISCONNECT:
                        const disconnectArgs = args as MethodCallArguments & { arguments: { identifier: string } }
                        error = await this.manager.disconnect(disconnectArgs.arguments.identifier)
                        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
                        break
                    case MethodName.DISCOVERY:
                        //TODO handle transactionId (store it in some object in the map to be able to flip it to cancelled)
                        const discoveryArgs = args as MethodCallArguments & { arguments: { identifier: string } }
                        const discoveryResult = await this.manager.discovery(discoveryArgs.arguments.identifier)
                        if (discoveryResult instanceof SimulatedBleError) {
                            blemulatorModule.handleReturnCall(args.callbackId, { error: discoveryResult })
                        } else {
                            blemulatorModule.handleReturnCall(args.callbackId, {
                                value: discoveryResult.map((service: SimulatedService) => mapToTransferService(service, discoveryArgs.arguments.identifier))
                            })
                        }
                        break
                    case MethodName.IS_DEVICE_CONNECTED:
                        const isConnectedArgs = args as MethodCallArguments & { arguments: { identifier: string } }
                        let isDeviceConnectedResult = await this.manager.isDeviceConnected(isConnectedArgs.arguments.identifier)
                        this.callbackErrorOrValue(args.callbackId, isDeviceConnectedResult)
                        break
                    case MethodName.REQUEST_MTU:
                        let mtuResult: SimulatedBleError | number
                        const requestMtuArgs = args as MethodCallArguments & { arguments: { identifier: string, mtu: number } }
                        mtuResult = await this.manager.requestMtu(requestMtuArgs.arguments.identifier, requestMtuArgs.arguments.mtu)
                        this.callbackErrorOrValue(args.callbackId, mtuResult)
                        break
                    case MethodName.READ_CHARACTERISTIC:
                        const readCharacteristicArgs = args as MethodCallArguments & {
                            arguments: { characteristicId: number, transactionId: string }
                        }
                        const readCharacteristicResult: SimulatedBleError | TransferCharacteristic
                            = await this.manager.readCharacteristic(readCharacteristicArgs.arguments.characteristicId)
                        this.callbackErrorOrValue(args.callbackId, readCharacteristicResult)
                        break
                    case MethodName.READ_CHARACTERISTIC_FOR_SERVICE:
                        const readCharacteristicForServiceArgs = args as MethodCallArguments & {
                            arguments: { serviceId: number, characteristicUuid: UUID, transactionId: string }
                        }
                        const readCharacteristicForServiceResult: SimulatedBleError | TransferCharacteristic
                            = await this.manager.readCharacteristicForService(
                                readCharacteristicForServiceArgs.arguments.serviceId,
                                readCharacteristicForServiceArgs.arguments.characteristicUuid
                            )
                        this.callbackErrorOrValue(args.callbackId, readCharacteristicForServiceResult)
                        break
                    case MethodName.READ_CHARACTERISTIC_FOR_DEVICE:
                        const readCharacteristicForDeviceArgs = args as MethodCallArguments & {
                            arguments: { identifier: string, serviceUuid: UUID, characteristicUuid: UUID, transactionId: string }
                        }
                        const readCharacteristicForDeviceResult: SimulatedBleError | TransferCharacteristic
                            = await this.manager.readCharacteristicForDevice(
                                readCharacteristicForDeviceArgs.arguments.identifier,
                                readCharacteristicForDeviceArgs.arguments.serviceUuid,
                                readCharacteristicForDeviceArgs.arguments.characteristicUuid
                            )
                        this.callbackErrorOrValue(args.callbackId, readCharacteristicForDeviceResult)
                        break
                    case MethodName.WRITE_CHARACTERISTIC:
                        const writeCharacteristicArgs = args as MethodCallArguments & {
                            arguments: {
                                transactionId: string,
                                withResponse: boolean,
                                value: Base64,
                                characteristicId: number,
                            }
                        }
                        const writeCharacteristicResult: SimulatedBleError | TransferCharacteristic
                            = await this.manager.writeCharacteristic(
                                writeCharacteristicArgs.arguments.characteristicId,
                                writeCharacteristicArgs.arguments.value,
                                writeCharacteristicArgs.arguments.withResponse,
                                writeCharacteristicArgs.arguments.transactionId
                            )

                        this.callbackErrorOrValue(args.callbackId, writeCharacteristicResult)
                        break
                    case MethodName.WRITE_CHARACTERISTIC_FOR_SERVICE:
                        const writeCharacteristicForServiceArgs = args as MethodCallArguments & {
                            arguments: {
                                transactionId: string,
                                withResponse: boolean,
                                value: Base64,
                                serviceId: number,
                                characteristicUuid: UUID,
                            }
                        }
                        const writeCharacteristicForServiceResult: SimulatedBleError | TransferCharacteristic
                            = await this.manager.writeCharacteristicForService(
                                writeCharacteristicForServiceArgs.arguments.serviceId,
                                writeCharacteristicForServiceArgs.arguments.characteristicUuid,
                                writeCharacteristicForServiceArgs.arguments.value,
                                writeCharacteristicForServiceArgs.arguments.withResponse,
                                writeCharacteristicForServiceArgs.arguments.transactionId
                            )

                        this.callbackErrorOrValue(args.callbackId, writeCharacteristicForServiceResult)
                        break
                    case MethodName.WRITE_CHARACTERISTIC_FOR_DEVICE:
                        const writeCharacteristicForDeviceArgs = args as MethodCallArguments & {
                            arguments: {
                                transactionId: string,
                                withResponse: boolean,
                                value: Base64,
                                identifier: string,
                                serviceUuid: UUID,
                                characteristicUuid: UUID,
                            }
                        }
                        const writeCharacteristicForDeviceResult: SimulatedBleError | TransferCharacteristic
                            = await this.manager.writeCharacteristicForDevice(
                                writeCharacteristicForDeviceArgs.arguments.identifier,
                                writeCharacteristicForDeviceArgs.arguments.serviceUuid,
                                writeCharacteristicForDeviceArgs.arguments.characteristicUuid,
                                writeCharacteristicForDeviceArgs.arguments.value,
                                writeCharacteristicForDeviceArgs.arguments.withResponse,
                                writeCharacteristicForDeviceArgs.arguments.transactionId
                            )

                        this.callbackErrorOrValue(args.callbackId, writeCharacteristicForDeviceResult)
                        break
                    case MethodName.MONITOR_CHARACTERISTIC:
                        const monitorCharacteristicArgs = args as MethodCallArguments & {
                            arguments: {
                                characteristicId: number,
                                transactionId: string
                            }
                        }
                        this.manager.monitorCharacteristic(
                            monitorCharacteristicArgs.arguments.characteristicId,
                            monitorCharacteristicArgs.arguments.transactionId
                        )
                        blemulatorModule.handleReturnCall(args.callbackId, {})
                        break
                    case MethodName.MONITOR_CHARACTERISTIC_FOR_SERVICE:
                        const monitorCharacteristicForServiceArgs = args as MethodCallArguments & {
                            arguments: {
                                serviceId: number,
                                characteristicUuid: UUID,
                                transactionId: string
                            }
                        }
                        this.manager.monitorCharacteristicForService(
                            monitorCharacteristicForServiceArgs.arguments.serviceId,
                            monitorCharacteristicForServiceArgs.arguments.characteristicUuid,
                            monitorCharacteristicForServiceArgs.arguments.transactionId
                        )
                        blemulatorModule.handleReturnCall(args.callbackId, {})
                        break
                    case MethodName.MONITOR_CHARACTERISTIC_FOR_DEVICE:
                        const monitorCharacteristicForDeviceArgs = args as MethodCallArguments & {
                            arguments: {
                                identifier: string,
                                serviceUuid: UUID,
                                characteristicUuid: UUID,
                                transactionId: string
                            }
                        }
                        this.manager.monitorCharacteristicForDevice(
                            monitorCharacteristicForDeviceArgs.arguments.identifier,
                            monitorCharacteristicForDeviceArgs.arguments.serviceUuid,
                            monitorCharacteristicForDeviceArgs.arguments.characteristicUuid,
                            monitorCharacteristicForDeviceArgs.arguments.transactionId
                        )
                        blemulatorModule.handleReturnCall(args.callbackId, {})
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

    private callbackErrorOrValue(callbackId: string, result: SimulatedBleError | any) {
        if (result instanceof SimulatedBleError) {
            blemulatorModule.handleReturnCall(callbackId, { error: result })
        } else {
            blemulatorModule.handleReturnCall(callbackId, { value: result })
        }
    }

    private setupConnectionStatePublisher() {
        this.manager.setConnectionStatePublisher((peripheralId, state) => {
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

            blemulatorModule.publishConnectionState(peripheralId, stateString)
        })
    }
}
