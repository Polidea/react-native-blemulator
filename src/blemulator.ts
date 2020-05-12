import { NativeModules, NativeEventEmitter, EmitterSubscription, EventSubscriptionVendor } from 'react-native';

const BlemulatorModule: BlemulatorModuleInterface & EventSubscriptionVendor = NativeModules.Blemulator;

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
        const emitter: NativeEventEmitter = new NativeEventEmitter(BlemulatorModule)
        this.emitterSubscription = emitter.addListener(
            _METHOD_CALL_EVENT,
            (args: MethodCallArguments) => {
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
        BlemulatorModule.runTest()
    }

    private test(callbackId: String) {
        BlemulatorModule.handleReturnCall(callbackId, JSON.stringify({ testProperty: "test value" }))
    }
}
