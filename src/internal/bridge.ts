import { EventSubscriptionVendor, NativeModules, EmitterSubscription, NativeEventEmitter } from "react-native";
import { SimulatedBleError } from "../ble-error";
import { ScanResult } from "../scan-result";
import { SimulationManager } from "./simulation-manager";
import { UUID, ConnectionState, AdapterState, Base64 } from "../types";
import { SimulatedService } from "../simulated-service";
import { TransferCharacteristic, mapToTransferService } from "./internal-types";
import { SimulatedPeripheral } from "../simulated-peripheral";

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
    GET_KNOWN_DEVICES = "getKnownDevices",
    GET_CONNECTED_DEVICED = "getConnectedDevices",
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    IS_DEVICE_CONNECTED = "isDeviceConnected",
    READ_RSSI = "readRssi",
    REQUEST_MTU = "requestMtu",
    REQUEST_CONNECTION_PRIORITY = "requestConnectionPriority",
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
    READ_DESCRIPTOR = "readDescriptor",
    READ_DESCRIPTOR_FOR_CHARACTERISTIC = "readDescriptorForCharacteristic",
    READ_DESCRIPTOR_FOR_SERVICE = "readDescriptorForService",
    READ_DESCRIPTOR_FOR_DEVICE = "readDescriptorForDevice",
    WRITE_DESCRIPTOR = "writeDescriptor",
    WRITE_DESCRIPTOR_FOR_CHARACTERISTIC = "writeDescriptorForCharacteristic",
    WRITE_DESCRIPTOR_FOR_SERVICE = "writeDescriptorForService",
    WRITE_DESCRIPTOR_FOR_DEVICE = "writeDescriptorForDevice",
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
            (args: MethodCallArguments) => { this.handleMethodCall(args) }
        )
    }

    private handleMethodCall(args: MethodCallArguments) {
        console.log(`Requested method: ${args.methodName}`)
        switch (args.methodName) {
            case MethodName.CREATE_CLIENT:
                this.createClient(args)
                break
            case MethodName.DESTROY_CLIENT:
                this.destroyClient(args)
                break
            case MethodName.ENABLE:
                this.enable(args)
                break
            case MethodName.DISABLE:
                this.disable(args)
                break
            case MethodName.START_SCAN:
                this.startScan(args)
                break
            case MethodName.STOP_SCAN:
                this.stopScan(args)
                break
            case MethodName.GET_KNOWN_DEVICES:
                this.getKnownDevices(args)
                break
            case MethodName.GET_CONNECTED_DEVICED:
                this.getConnectedDevices(args)
                break
            case MethodName.CONNECT:
                this.connect(args)
                break
            case MethodName.DISCONNECT:
                this.disconnect(args)
                break
            case MethodName.DISCOVERY:
                this.discovery(args)
                break
            case MethodName.IS_DEVICE_CONNECTED:
                this.isDeviceConnected(args)
                break
            case MethodName.READ_RSSI:
                this.readRssi(args)
                break
            case MethodName.REQUEST_MTU:
                this.requestMtu(args)
                break
            case MethodName.REQUEST_CONNECTION_PRIORITY:
                this.requestConnectionPriority(args)
                break
            case MethodName.READ_CHARACTERISTIC:
                this.readCharacteristic(args)
                break
            case MethodName.READ_CHARACTERISTIC_FOR_SERVICE:
                this.readCharacteristicForService(args)
                break
            case MethodName.READ_CHARACTERISTIC_FOR_DEVICE:
                this.readCharacteristicForDevice(args)
                break
            case MethodName.WRITE_CHARACTERISTIC:
                this.writeCharacteristic(args)
                break
            case MethodName.WRITE_CHARACTERISTIC_FOR_SERVICE:
                this.writeCharacteristicForService(args)
                break
            case MethodName.WRITE_CHARACTERISTIC_FOR_DEVICE:
                this.writeCharacteristicForDevice(args)
                break
            case MethodName.MONITOR_CHARACTERISTIC:
                this.monitorCharacteristic(args)
                break
            case MethodName.MONITOR_CHARACTERISTIC_FOR_SERVICE:
                this.monitorCharacteristicForService(args)
                break
            case MethodName.MONITOR_CHARACTERISTIC_FOR_DEVICE:
                this.monitorCharacteristicForDevice(args)
                break
            case MethodName.READ_DESCRIPTOR:
                this.readDescriptor(args)
                break
            case MethodName.READ_DESCRIPTOR_FOR_CHARACTERISTIC:
                this.readDescriptorForCharacteristic(args)
                break
            case MethodName.READ_DESCRIPTOR_FOR_SERVICE:
                this.readDescriptorForService(args)
                break
            case MethodName.READ_DESCRIPTOR_FOR_DEVICE:
                this.readDescriptorForDevice(args)
                break
            case MethodName.WRITE_DESCRIPTOR:
                this.writeDescriptor(args)
                break
            case MethodName.WRITE_DESCRIPTOR_FOR_CHARACTERISTIC:
                this.writeDescriptorForCharacteristic(args)
                break
            case MethodName.WRITE_DESCRIPTOR_FOR_SERVICE:
                this.writeDescriptorForService(args)
                break
            case MethodName.WRITE_DESCRIPTOR_FOR_DEVICE:
                this.writeDescriptorForDevice(args)
                break
            default:
                console.error("Uknown method requested")
        }
    }

    simulate(): Promise<void> {
        return blemulatorModule.simulate()
    }

    private createClient(args: MethodCallArguments) {
        this.manager.setAdapterStatePublisher((state: AdapterState) => { blemulatorModule.publishAdapterState(state) })
        blemulatorModule.handleReturnCall(args.callbackId, {})
    }

    private destroyClient(args: MethodCallArguments) {
        this.manager.setAdapterStatePublisher()
        blemulatorModule.handleReturnCall(args.callbackId, {})
    }

    private async enable(args: MethodCallArguments) {
        //TODO handle transactionId (store it in some object in the map to be able to flip it to cancelled)
        const error = await this.manager.enable()
        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
    }

    private async disable(args: MethodCallArguments) {
        //TODO handle transactionId (store it in some object in the map to be able to flip it to cancelled)
        const error = await this.manager.disable()
        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
    }

    private startScan(args: MethodCallArguments) {
        const scanArgs = args as MethodCallArguments & {
            arguments: {
                filteredUuids?: Array<UUID>,
                scanMode?: number,
                callbackType?: number
            }
        }
        const error = this.manager.startScan(
            scanArgs.arguments.filteredUuids,
            scanArgs.arguments.scanMode,
            scanArgs.arguments.callbackType,
            (scanResult) => { blemulatorModule.addScanResult(scanResult) }
        )
        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
    }

    private stopScan(args: MethodCallArguments) {
        this.manager.stopScan()
        blemulatorModule.handleReturnCall(args.callbackId, {})
    }

    private getKnownDevices(args: MethodCallArguments) {
        const getKnownDevicesArgs = args as MethodCallArguments & {
            arguments: {
                deviceIds: Array<string>,
            }
        }
        const result: Array<SimulatedPeripheral> = this.manager.getKnownDevices(getKnownDevicesArgs.arguments.deviceIds)
        blemulatorModule.handleReturnCall(args.callbackId, {
            value: result.map(
                (peripheral) => {
                    return {
                        id: peripheral.id,
                        name: peripheral.name
                    }
                }
            )
        })
    }

    private getConnectedDevices(args: MethodCallArguments) {
        const getConnectedDevicesArguments = args as MethodCallArguments & {
            arguments: {
                serviceUuids: Array<UUID>
            }
        }
        const value = this.manager.getConnectedDevices(getConnectedDevicesArguments.arguments.serviceUuids)
        blemulatorModule.handleReturnCall(args.callbackId, {
            value: value.map((peripheral) => {
                return {
                    id: peripheral.id,
                    name: peripheral.name
                }
            })
        })
    }

    private async connect(args: MethodCallArguments) {
        const connectArgs = args as MethodCallArguments & {
            arguments: {
                identifier: string, isAutoConnect?: boolean, requestMtu?: number, refreshGatt?: boolean, timeout?: number
            }
        }
        const connectResult: SimulatedBleError | SimulatedPeripheral = await this.manager.connect(
            connectArgs.arguments.identifier, connectArgs.arguments.requestMtu
        )
        if (connectResult instanceof SimulatedBleError) {
            blemulatorModule.handleReturnCall(args.callbackId, { error: connectResult })
        } else {
            blemulatorModule.handleReturnCall(args.callbackId, {
                value: {
                    id: connectResult.id,
                    name: connectResult.name
                }
            })
        }
    }

    private async disconnect(args: MethodCallArguments) {
        const disconnectArgs = args as MethodCallArguments & { arguments: { identifier: string } }
        const error = await this.manager.disconnect(disconnectArgs.arguments.identifier)
        blemulatorModule.handleReturnCall(args.callbackId, { error: error })
    }

    private async isDeviceConnected(args: MethodCallArguments) {
        const isConnectedArgs = args as MethodCallArguments & { arguments: { identifier: string } }
        let isDeviceConnectedResult = await this.manager.isDeviceConnected(isConnectedArgs.arguments.identifier)
        this.callbackErrorOrValue(args.callbackId, isDeviceConnectedResult)
    }

    private async readRssi(args: MethodCallArguments) {
        const readRssiArgs = args as MethodCallArguments & {
            arguments: {
                identifier: string,
                transactionId: string,
            }
        }

        const result: SimulatedBleError | SimulatedPeripheral = await this.manager.readRssi(
            readRssiArgs.arguments.identifier,
            readRssiArgs.arguments.transactionId
        )
        if (result instanceof SimulatedBleError) {
            blemulatorModule.handleReturnCall(args.callbackId, { error: result })
        } else {
            blemulatorModule.handleReturnCall(args.callbackId, {
                value: {
                    id: result.id,
                    name: result.name,
                    rssi: result.getScanResult().rssi
                }
            })
        }
    }

    private async requestConnectionPriority(args: MethodCallArguments) {
        const requestConnectionPriorityArgs = args as MethodCallArguments & {
            arguments: {
                identifier: string,
                connectionPriority: number,
                transactionId: string,
            }
        }
        const requestConnectionPriorityResult: SimulatedBleError | SimulatedPeripheral
            = await this.manager.requestConnectionPriority(
                requestConnectionPriorityArgs.arguments.identifier,
                requestConnectionPriorityArgs.arguments.connectionPriority,
                requestConnectionPriorityArgs.arguments.transactionId
            )
        if (requestConnectionPriorityResult instanceof SimulatedBleError) {
            blemulatorModule.handleReturnCall(args.callbackId, { error: requestConnectionPriorityResult })
        } else {
            blemulatorModule.handleReturnCall(args.callbackId, {
                value: {
                    id: requestConnectionPriorityResult.id,
                    name: requestConnectionPriorityResult.name
                }
            })
        }
    }

    private async requestMtu(args: MethodCallArguments) {
        let mtuResult: SimulatedBleError | number
        const requestMtuArgs = args as MethodCallArguments & { arguments: { identifier: string, mtu: number } }
        mtuResult = await this.manager.requestMtu(requestMtuArgs.arguments.identifier, requestMtuArgs.arguments.mtu)
        this.callbackErrorOrValue(args.callbackId, mtuResult)
    }

    private async discovery(args: MethodCallArguments) {
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
    }

    private async readCharacteristic(args: MethodCallArguments) {
        const readCharacteristicArgs = args as MethodCallArguments & {
            arguments: { characteristicId: number, transactionId: string }
        }
        const readCharacteristicResult: SimulatedBleError | TransferCharacteristic
            = await this.manager.readCharacteristic(readCharacteristicArgs.arguments.characteristicId)
        this.callbackErrorOrValue(args.callbackId, readCharacteristicResult)
    }

    private async readCharacteristicForService(args: MethodCallArguments) {
        const readCharacteristicForServiceArgs = args as MethodCallArguments & {
            arguments: { serviceId: number, characteristicUuid: UUID, transactionId: string }
        }
        const readCharacteristicForServiceResult: SimulatedBleError | TransferCharacteristic
            = await this.manager.readCharacteristicForService(
                readCharacteristicForServiceArgs.arguments.serviceId,
                readCharacteristicForServiceArgs.arguments.characteristicUuid
            )
        this.callbackErrorOrValue(args.callbackId, readCharacteristicForServiceResult)
    }

    private async readCharacteristicForDevice(args: MethodCallArguments) {
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
    }

    private async writeCharacteristic(args: MethodCallArguments) {
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
    }

    private async writeCharacteristicForService(args: MethodCallArguments) {
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
    }

    private async writeCharacteristicForDevice(args: MethodCallArguments) {
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
    }

    private async monitorCharacteristic(args: MethodCallArguments) {
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
    }

    private async monitorCharacteristicForService(args: MethodCallArguments) {
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
    }

    private async monitorCharacteristicForDevice(args: MethodCallArguments) {
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
    }

    private async readDescriptor(args: MethodCallArguments) {
        const readDescriptorArgs = args as MethodCallArguments & {
            arguments: {
                descriptorId: number,
                transactionId: string,
            }
        }
        const readDescriptorResult = await this.manager.readDescriptor(
            readDescriptorArgs.arguments.descriptorId,
            readDescriptorArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, readDescriptorResult)
    }

    private async readDescriptorForCharacteristic(args: MethodCallArguments) {
        const readDescriptorForCharacteristicArgs = args as MethodCallArguments & {
            arguments: {
                characteristicId: number,
                descriptorUuid: UUID,
                transactionId: string,
            }
        }
        const readDescriptorForCharacteristicResult = await this.manager.readDescriptorForCharacteristic(
            readDescriptorForCharacteristicArgs.arguments.characteristicId,
            readDescriptorForCharacteristicArgs.arguments.descriptorUuid,
            readDescriptorForCharacteristicArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, readDescriptorForCharacteristicResult)
    }

    private async readDescriptorForService(args: MethodCallArguments) {
        const readDescriptorForServiceArgs = args as MethodCallArguments & {
            arguments: {
                serviceId: number,
                characteristicUuid: UUID,
                descriptorUuid: UUID,
                transactionId: string,
            }
        }
        const readDescriptorForServiceResult = await this.manager.readDescriptorForService(
            readDescriptorForServiceArgs.arguments.serviceId,
            readDescriptorForServiceArgs.arguments.characteristicUuid,
            readDescriptorForServiceArgs.arguments.descriptorUuid,
            readDescriptorForServiceArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, readDescriptorForServiceResult)
    }

    private async readDescriptorForDevice(args: MethodCallArguments) {
        const readDescriptorForDeviceArgs = args as MethodCallArguments & {
            arguments: {
                identifier: string,
                serviceUuid: UUID,
                characteristicUuid: UUID,
                descriptorUuid: UUID,
                transactionId: string,
            }
        }
        const readDescriptorForDeviceResult = await this.manager.readDescriptorForDevice(
            readDescriptorForDeviceArgs.arguments.identifier,
            readDescriptorForDeviceArgs.arguments.serviceUuid,
            readDescriptorForDeviceArgs.arguments.characteristicUuid,
            readDescriptorForDeviceArgs.arguments.descriptorUuid,
            readDescriptorForDeviceArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, readDescriptorForDeviceResult)
    }

    private async writeDescriptor(args: MethodCallArguments) {
        const writeDescriptorArgs = args as MethodCallArguments & {
            arguments: {
                descriptorId: number,
                transactionId: string,
                value: Base64,
            }
        }
        const writeDescriptorResult = await this.manager.writeDescriptor(
            writeDescriptorArgs.arguments.descriptorId,
            writeDescriptorArgs.arguments.value,
            writeDescriptorArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, writeDescriptorResult)
    }

    private async writeDescriptorForCharacteristic(args: MethodCallArguments) {
        const writeDescriptorForCharacteristicArgs = args as MethodCallArguments & {
            arguments: {
                characteristicId: number,
                descriptorUuid: UUID,
                transactionId: string,
                value: Base64,
            }
        }
        const writeDescriptorForCharacteristicResult = await this.manager.writeDescriptorForCharacteristic(
            writeDescriptorForCharacteristicArgs.arguments.characteristicId,
            writeDescriptorForCharacteristicArgs.arguments.descriptorUuid,
            writeDescriptorForCharacteristicArgs.arguments.value,
            writeDescriptorForCharacteristicArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, writeDescriptorForCharacteristicResult)
    }

    private async writeDescriptorForService(args: MethodCallArguments) {
        const writeDescriptorForServiceArgs = args as MethodCallArguments & {
            arguments: {
                serviceId: number,
                characteristicUuid: UUID,
                descriptorUuid: UUID,
                transactionId: string,
                value: Base64,
            }
        }
        const writeDescriptorForServiceResult = await this.manager.writeDescriptorForService(
            writeDescriptorForServiceArgs.arguments.serviceId,
            writeDescriptorForServiceArgs.arguments.characteristicUuid,
            writeDescriptorForServiceArgs.arguments.descriptorUuid,
            writeDescriptorForServiceArgs.arguments.value,
            writeDescriptorForServiceArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, writeDescriptorForServiceResult)
    }

    private async writeDescriptorForDevice(args: MethodCallArguments) {
        const writeDescriptorForDeviceArgs = args as MethodCallArguments & {
            arguments: {
                identifier: string,
                serviceUuid: UUID,
                characteristicUuid: UUID,
                descriptorUuid: UUID,
                transactionId: string,
                value: Base64,
            }
        }
        const writeDescriptorForDeviceResult = await this.manager.writeDescriptorForDevice(
            writeDescriptorForDeviceArgs.arguments.identifier,
            writeDescriptorForDeviceArgs.arguments.serviceUuid,
            writeDescriptorForDeviceArgs.arguments.characteristicUuid,
            writeDescriptorForDeviceArgs.arguments.descriptorUuid,
            writeDescriptorForDeviceArgs.arguments.value,
            writeDescriptorForDeviceArgs.arguments.transactionId
        )
        this.callbackErrorOrValue(args.callbackId, writeDescriptorForDeviceResult)
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
