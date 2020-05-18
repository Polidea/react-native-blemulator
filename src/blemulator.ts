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

const MethodName = {
    test: "test",
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
                    case MethodName.test:
                        this.test(args.callbackId);
                    default:
                        console.log("Uknown method requested");

                }
            },
        )
    }

    runNativeToJsCommunicationTest() {
        blemulatorModule.runTest()
    }

    private test(callbackId: String) {
        blemulatorModule.handleReturnCall(callbackId, JSON.stringify({ testProperty: "test value" }))
    }
}
