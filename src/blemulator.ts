import { NativeModules, NativeEventEmitter, EmitterSubscription, EventSubscriptionVendor } from 'react-native';

const blemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor = NativeModules.Blemulator;

const _METHOD_CALL_EVENT = "MethodCall"

interface BlemulatorModuleInterface {
    runTest(): void,
    handleReturnCall(callbackId: String, jsonString: String): void,
    sampleMethod(stringArgument: String, numberArgument: Number, callback: (arg: String) => void): void
}

interface MethodCallArguments {
    methodName: String,
    callbackId: String
}

enum MethodName {
    TEST = "test",
}

export class Blemulator {
    private emitterSubscription: EmitterSubscription;

    constructor() {
        const emitter: NativeEventEmitter = new NativeEventEmitter(blemulatorModule)
        this.emitterSubscription = emitter.addListener(
            _METHOD_CALL_EVENT,
            (args: MethodCallArguments) => {
                console.log(`Requested method: ${args.methodName}`)
                switch (args.methodName) {
                    case MethodName.TEST:
                        this.test(args.callbackId)
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

    private test(callbackId: String) {
        console.log(`Handling call ${callbackId} in JS`)
        blemulatorModule.handleReturnCall(callbackId, JSON.stringify({ testProperty: "test value" }))
    }
}
