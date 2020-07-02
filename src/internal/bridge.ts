import { EventSubscriptionVendor, NativeModules, EmitterSubscription, NativeEventEmitter } from "react-native";
import { SimulatedBleError } from "../ble-error";
import { ScanResult } from "../scan-result";
import { SimulationManager } from "./simulation-manager";
import { UUID, ConnectionState, AdapterState, Base64 } from "../types";
import { SimulatedCharacteristic } from "../simulated-characteristic";
import { SimulatedService } from "../simulated-service";
import { SimulatedDescriptor } from "../simulated-descriptor";

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
    IS_DEVICE_CONNECTED = "isDeviceConnected",
    CREATE_CLIENT = "createClient",
    DESTROY_CLIENT = "destroyClient",
    ENABLE = "enable",
    DISABLE = "disable",
    GET_CURRENT_STATE = "getCurrentState",
    DISCOVERY = "discovery",
    REQUEST_MTU = "requestMtu"
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
                        const result = await this.manager.discovery(discoveryArgs.arguments.identifier)
                        if (result instanceof SimulatedBleError) {
                            blemulatorModule.handleReturnCall(args.callbackId, { error: result })
                        } else {
                            blemulatorModule.handleReturnCall(args.callbackId, {
                                value: result.map((service: SimulatedService) => this.mapToTransferService(service, discoveryArgs.arguments.identifier))
                            })
                        }
                        break
                    case MethodName.IS_DEVICE_CONNECTED:
                        const isConnectedArgs = args as MethodCallArguments & { arguments: { identifier: string } }
                        let isDeviceConnectedResult = await this.manager.isDeviceConnected(isConnectedArgs.arguments.identifier)
                        if (isDeviceConnectedResult instanceof SimulatedBleError) {
                            blemulatorModule.handleReturnCall(args.callbackId, { error: isDeviceConnectedResult })
                        } else {
                            blemulatorModule.handleReturnCall(args.callbackId, { value: isDeviceConnectedResult })
                        }
                    case MethodName.REQUEST_MTU:
                        let mtuResult: SimulatedBleError | number
                        const requestMtuArgs = args as MethodCallArguments & { arguments: { identifier: string, mtu: number } }
                        mtuResult = await this.manager.requestMtu(requestMtuArgs.arguments.identifier, requestMtuArgs.arguments.mtu)
                        let data: { error?: SimulatedBleError, value?: number }
                        if (mtuResult instanceof SimulatedBleError) {
                            data = { error: mtuResult }
                        } else {
                            data = { value: mtuResult }    
                        }
                        blemulatorModule.handleReturnCall(args.callbackId, data)
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

    private mapToTransferService(service: SimulatedService, peripheralId: string): TransferService {
        return {
            peripheralId: peripheralId,
            id: service.id,
            uuid: service.uuid,
            characteristics: service.getCharacteristics().map((charateristic) => this.mapToTransferCharacteristic(charateristic, peripheralId))
        }
    }

    private mapToTransferCharacteristic(characteristic: SimulatedCharacteristic, peripheralId: string, addValue?: boolean): TransferCharacteristic {
        return {
            peripheralId: peripheralId,
            id: characteristic.id,
            uuid: characteristic.uuid,
            serviceId: characteristic.service!.id,
            serviceUuid: characteristic.service!.uuid,
            isReadable: characteristic.isReadable,
            isIndicatable: characteristic.isIndicatable,
            isNotifiable: characteristic.isNotifiable,
            isNotifying: characteristic.isNotifying,
            isWritableWithResponse: characteristic.isWritableWithResponse,
            isWritableWithoutResponse: characteristic.isWritableWithoutResponse,
            descriptors: characteristic.getDescriptors().map((descriptor) => this.mapToTransferDescriptor(descriptor, peripheralId)),
            value: addValue ? characteristic.getValue() : undefined
        }
    }

    private mapToTransferDescriptor(descriptor: SimulatedDescriptor, peripheralId: string, addValue?: boolean): TransferDescriptor {
        return {
            peripheralId: peripheralId,
            id: descriptor.id,
            uuid: descriptor.uuid,
            characteristicId: descriptor.characteristic!.id,
            characteristicUuid: descriptor.characteristic!.uuid,
            serviceId: descriptor.characteristic!.service!.id,
            serviceUuid: descriptor.characteristic!.service!.uuid,
            value: addValue ? descriptor.getValue() : undefined
        }
    }
}

interface TransferService {
    peripheralId: string,
    id: number,
    uuid: UUID,
    characteristics: Array<TransferCharacteristic>
}

interface TransferCharacteristic {
    peripheralId: string,
    id: number,
    uuid: UUID,
    serviceId: number,
    serviceUuid: UUID,
    isReadable: boolean,
    isWritableWithResponse: boolean,
    isWritableWithoutResponse: boolean,
    isNotifiable: boolean,
    isIndicatable: boolean,
    isNotifying: boolean,
    value?: Base64,
    descriptors?: Array<TransferDescriptor>
}

interface TransferDescriptor {
    peripheralId: string,
    id: number,
    uuid: UUID,
    characteristicId: number,
    characteristicUuid: UUID,
    serviceId: number,
    serviceUuid: UUID,
    value?: Base64
}