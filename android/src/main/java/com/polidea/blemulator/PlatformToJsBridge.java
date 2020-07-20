package com.polidea.blemulator;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.polidea.blemulator.containers.CachedService;
import com.polidea.blemulator.parser.ErrorParser;
import com.polidea.blemulator.parser.GattParser;
import com.polidea.multiplatformbleadapter.Characteristic;
import com.polidea.multiplatformbleadapter.ConnectionOptions;
import com.polidea.multiplatformbleadapter.Descriptor;
import com.polidea.multiplatformbleadapter.Device;
import com.polidea.multiplatformbleadapter.OnErrorCallback;
import com.polidea.multiplatformbleadapter.OnSuccessCallback;
import com.polidea.multiplatformbleadapter.RefreshGattMoment;
import com.polidea.multiplatformbleadapter.errors.BleError;
import com.polidea.multiplatformbleadapter.errors.BleErrorCode;

import java.util.List;

import androidx.annotation.Nullable;

public class PlatformToJsBridge {
    private static final String TAG = PlatformToJsBridge.class.getSimpleName();
    private final ReactContext reactContext;
    private final JsCallHandler callHandler;
    private final GattParser gattParser = new GattParser();
    private final ErrorParser errorParser = new ErrorParser();

    public PlatformToJsBridge(ReactContext reactContext, JsCallHandler callHandler) {
        this.reactContext = reactContext;
        this.callHandler = callHandler;
    }

    public void createClient() {
        callMethod(MethodName.CREATE_CLIENT, null,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        //nothing expected
                    }
                });
    }

    public void destroyClient() {
        callMethod(MethodName.DESTROY_CLIENT, null, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                //nothing expected
            }
        });
    }

    public void enable(String transactionId, final OnSuccessCallback<Void> successCallback, final OnErrorCallback errorCallback) {
        WritableMap args = Arguments.createMap();
        args.putString(JsArgumentName.TRANSACTION_ID, transactionId);
        callMethod(MethodName.ENABLE, args,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        if (args.hasKey(NativeArgumentName.ERROR)) {
                            errorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                        } else {
                            successCallback.onSuccess(null);
                        }
                    }
                });

    }

    public void disable(String transactionId, final OnSuccessCallback<Void> successCallback, final OnErrorCallback errorCallback) {
        WritableMap args = Arguments.createMap();
        args.putString(JsArgumentName.TRANSACTION_ID, transactionId);
        callMethod(MethodName.DISABLE, args,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        if (args.hasKey(NativeArgumentName.ERROR)) {
                            errorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                        } else {
                            successCallback.onSuccess(null);
                        }
                    }
                });
    }

    public void startScan(String[] filteredUUIDs,
                          int scanMode,
                          int callbackType,
                          final OnErrorCallback onErrorCallback) {
        WritableMap params = Arguments.createMap();

        if (filteredUUIDs != null) {
            params.putArray(JsArgumentName.FILTERED_UUIDS, Arguments.fromArray(filteredUUIDs));
        } else {
            params.putArray(JsArgumentName.FILTERED_UUIDS, null);
        }

        params.putInt(JsArgumentName.CALLBACK_TYPE, callbackType);
        params.putInt(JsArgumentName.SCAN_MODE, scanMode);

        callMethod(
                MethodName.START_SCAN,
                params,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        if (args.hasKey(NativeArgumentName.ERROR)) {
                            onErrorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                        }
                    }
                }
        );
    }

    public void stopScan() {
        callMethod(MethodName.STOP_SCAN, null, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                Log.d(TAG, "stopScan callback called");
                //TODO can this throw errors? If so they'll be passed in the callback
            }
        });
    }

    public void connect(String deviceIdentifier,
                        ConnectionOptions connectionOptions,
                        final OnSuccessCallback<Device> onSuccessCallback,
                        final OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        arguments.putBoolean(JsArgumentName.IS_AUTO_CONNECT, connectionOptions.getAutoConnect());
        arguments.putInt(JsArgumentName.REQUEST_MTU, connectionOptions.getRequestMTU());
        arguments.putBoolean(JsArgumentName.REFRESH_GATT, connectionOptions.getRefreshGattMoment() == RefreshGattMoment.ON_CONNECTED);
        if (connectionOptions.getTimeoutInMillis() != null) {
            arguments.putInt(JsArgumentName.TIMEOUT, connectionOptions.getTimeoutInMillis().intValue());
        }
        callMethod(MethodName.CONNECT, arguments, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                if (args.hasKey(NativeArgumentName.ERROR)) {
                    onErrorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                } else {
                    onSuccessCallback.onSuccess(null);
                }
            }
        });
    }

    public void cancelDeviceConnection(final String deviceIdentifier,
                                       final OnSuccessCallback<Device> onSuccessCallback,
                                       final OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        callMethod(
                MethodName.CANCEL_CONNECTION_OR_DISCONNECT,
                arguments,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        if (args.hasKey(NativeArgumentName.ERROR)) {
                            onErrorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                        } else {
                            onSuccessCallback.onSuccess(null);
                        }
                    }
                });
    }

    public void isDeviceConnected(String deviceIdentifier,
                                  final OnSuccessCallback<Boolean> onSuccessCallback,
                                  final OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        callMethod(MethodName.IS_DEVICE_CONNECTED, arguments, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                if (args.hasKey(NativeArgumentName.ERROR)) {
                    onErrorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                } else {
                    onSuccessCallback.onSuccess(args.getBoolean(NativeArgumentName.VALUE));
                }
            }
        });
    }

    public void requestMtu(final String deviceIdentifier,
                           final int mtu,
                           final OnSuccessCallback<Integer> onSuccessCallback,
                           final OnErrorCallback onErrorCallback) {

        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        arguments.putInt(JsArgumentName.MTU, mtu);
        callMethod(
                MethodName.REQUEST_MTU,
                arguments,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        if (args.hasKey(NativeArgumentName.ERROR)) {
                            onErrorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                        } else {
                            onSuccessCallback.onSuccess(args.getInt(NativeArgumentName.VALUE));
                        }
                    }
                }
        );
    }

    public void discoverAllGatts(String deviceIdentifier,
                                 String transactionId,
                                 final OnSuccessCallback<List<CachedService>> onSuccessCallback,
                                 final OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);
        callMethod(
                MethodName.DISCOVERY,
                arguments,
                new JsCallHandler.Callback() {
                    @Override
                    public void invoke(ReadableMap args) {
                        if (args.hasKey(NativeArgumentName.ERROR)) {
                            onErrorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                        } else {
                            onSuccessCallback.onSuccess(gattParser.parseDiscoveryResponse(args.getArray(NativeArgumentName.VALUE)));
                        }
                    }
                }
        );
    }

    public void readCharacteristicForDevice(String deviceIdentifier,
                                            String serviceUUID,
                                            String characteristicUUID,
                                            String transactionId,
                                            final OnSuccessCallback<Characteristic> onSuccessCallback,
                                            final OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        arguments.putString(JsArgumentName.SERVICE_UUID, serviceUUID);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.READ_CHARACTERISTIC_FOR_DEVICE, arguments, createCallbackReturningCharacteristicOrError(onSuccessCallback, onErrorCallback));
    }

    public void readCharacteristicForService(int serviceIdentifier,
                                             String characteristicUUID,
                                             String transactionId,
                                             final OnSuccessCallback<Characteristic> onSuccessCallback,
                                             final OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.SERVICE_ID, serviceIdentifier);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(
                MethodName.READ_CHARACTERISTIC_FOR_SERVICE,
                arguments,
                createCallbackReturningCharacteristicOrError(onSuccessCallback, onErrorCallback)
        );
    }

    public void readCharacteristic(int characteristicIdentifier,
                                   String transactionId,
                                   final OnSuccessCallback<Characteristic> onSuccessCallback,
                                   final OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.CHARACTERISTIC_ID, characteristicIdentifier);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(
                MethodName.READ_CHARACTERISTIC,
                arguments,
                createCallbackReturningCharacteristicOrError(onSuccessCallback, onErrorCallback)
        );
    }

    private JsCallHandler.Callback createCallbackReturningCharacteristicOrError(
            final OnSuccessCallback<Characteristic> onSuccessCallback, final OnErrorCallback onErrorCallback) {
        return new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                if (args.hasKey(NativeArgumentName.ERROR)) {
                    onErrorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                } else {
                    onSuccessCallback.onSuccess(gattParser.parseCharacteristic(args.getMap(NativeArgumentName.VALUE), null).getCharacteristic());
                }
            }
        };
    }

    public void writeCharacteristicForDevice(String deviceIdentifier,
                                             String serviceUUID,
                                             String characteristicUUID,
                                             String valueBase64,
                                             boolean withResponse,
                                             String transactionId,
                                             OnSuccessCallback<Characteristic> onSuccessCallback,
                                             OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        arguments.putString(JsArgumentName.SERVICE_UUID, serviceUUID);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);
        arguments.putString(JsArgumentName.VALUE, valueBase64);
        arguments.putBoolean(JsArgumentName.WITH_RESPONSE, withResponse);

        callMethod(
                MethodName.WRITE_CHARACTERISTIC_FOR_DEVICE,
                arguments,
                createCallbackReturningCharacteristicOrError(onSuccessCallback, onErrorCallback)
        );
    }

    public void writeCharacteristicForService(int serviceIdentifier,
                                              String characteristicUUID,
                                              String valueBase64,
                                              boolean withResponse,
                                              String transactionId,
                                              OnSuccessCallback<Characteristic> onSuccessCallback,
                                              OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.SERVICE_ID, serviceIdentifier);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);
        arguments.putString(JsArgumentName.VALUE, valueBase64);
        arguments.putBoolean(JsArgumentName.WITH_RESPONSE, withResponse);

        callMethod(
                MethodName.WRITE_CHARACTERISTIC_FOR_SERVICE,
                arguments,
                createCallbackReturningCharacteristicOrError(onSuccessCallback, onErrorCallback)
        );
    }

    public void writeCharacteristic(int characteristicIdentifier,
                                    String valueBase64,
                                    boolean withResponse,
                                    String transactionId,
                                    OnSuccessCallback<Characteristic> onSuccessCallback,
                                    OnErrorCallback onErrorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.CHARACTERISTIC_ID, characteristicIdentifier);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);
        arguments.putString(JsArgumentName.VALUE, valueBase64);
        arguments.putBoolean(JsArgumentName.WITH_RESPONSE, withResponse);

        callMethod(
                MethodName.WRITE_CHARACTERISTIC,
                arguments,
                createCallbackReturningCharacteristicOrError(onSuccessCallback, onErrorCallback)
        );
    }

    public void monitorCharacteristicForDevice(String deviceIdentifier,
                                               String serviceUUID,
                                               String characteristicUUID,
                                               String transactionId) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceIdentifier);
        arguments.putString(JsArgumentName.SERVICE_UUID, serviceUUID);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.MONITOR_CHARACTERISTIC_FOR_DEVICE, arguments, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                //any errors will be handled in SimulatedAdapter.publishNotification()
            }
        });
    }

    public void monitorCharacteristicForService(int serviceIdentifier,
                                                String characteristicUUID,
                                                String transactionId) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.SERVICE_ID, serviceIdentifier);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.MONITOR_CHARACTERISTIC_FOR_SERVICE, arguments, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                //any errors will be handled in SimulatedAdapter.publishNotification()
            }
        });
    }

    public void monitorCharacteristic(int characteristicIdentifier,
                                      String transactionId) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.CHARACTERISTIC_ID, characteristicIdentifier);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.MONITOR_CHARACTERISTIC, arguments, new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                //any errors will be handled in SimulatedAdapter.publishNotification()
            }
        });
    }

    public void readDescriptorForDevice(String deviceId,
                                        String serviceUUID,
                                        String characteristicUUID,
                                        String descriptorUUID,
                                        String transactionId,
                                        OnSuccessCallback<Descriptor> successCallback,
                                        OnErrorCallback errorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putString(JsArgumentName.IDENTIFIER, deviceId);
        arguments.putString(JsArgumentName.SERVICE_UUID, serviceUUID);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.DESCRIPTOR_UUID, descriptorUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.READ_DESCRIPTOR_FOR_DEVICE, arguments, createCallbackReturningDescriptorOrError(successCallback, errorCallback));
    }

    public void readDescriptorForService(int serviceIdentifier,
                                         String characteristicUUID,
                                         String descriptorUUID,
                                         String transactionId,
                                         OnSuccessCallback<Descriptor> successCallback,
                                         OnErrorCallback errorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.SERVICE_ID, serviceIdentifier);
        arguments.putString(JsArgumentName.CHARACTERISTIC_UUID, characteristicUUID);
        arguments.putString(JsArgumentName.DESCRIPTOR_UUID, descriptorUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.READ_DESCRIPTOR_FOR_SERVICE, arguments, createCallbackReturningDescriptorOrError(successCallback, errorCallback));
    }

    public void readDescriptorForCharacteristic(int characteristicIdentifier,
                                                String descriptorUUID,
                                                String transactionId,
                                                OnSuccessCallback<Descriptor> successCallback,
                                                OnErrorCallback errorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.CHARACTERISTIC_ID, characteristicIdentifier);
        arguments.putString(JsArgumentName.DESCRIPTOR_UUID, descriptorUUID);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.READ_DESCRIPTOR_FOR_CHARACTERISTIC, arguments, createCallbackReturningDescriptorOrError(successCallback, errorCallback));
    }

    public void readDescriptor(int descriptorIdentifier,
                               String transactionId,
                               OnSuccessCallback<Descriptor> successCallback,
                               OnErrorCallback errorCallback) {
        WritableMap arguments = Arguments.createMap();
        arguments.putInt(JsArgumentName.DESCRIPTOR_ID, descriptorIdentifier);
        arguments.putString(JsArgumentName.TRANSACTION_ID, transactionId);

        callMethod(MethodName.READ_DESCRIPTOR, arguments, createCallbackReturningDescriptorOrError(successCallback, errorCallback));
    }

    private JsCallHandler.Callback createCallbackReturningDescriptorOrError(final OnSuccessCallback<Descriptor> successCallback, final OnErrorCallback errorCallback) {
        return new JsCallHandler.Callback() {
            @Override
            public void invoke(ReadableMap args) {
                if (args.hasKey(NativeArgumentName.ERROR)) {
                    errorCallback.onError(errorParser.parseError(args.getMap(NativeArgumentName.ERROR)));
                } else {
                    successCallback.onSuccess(gattParser.parseDescriptor(args.getMap(NativeArgumentName.VALUE)));
                }
            }
        };
    }

    private void callMethod(String methodName, @Nullable ReadableMap arguments, JsCallHandler.Callback callback) {
        WritableMap params = Arguments.createMap();
        String callbackId = callHandler.addCallback(callback);
        params.putString("methodName", methodName);
        params.putString("callbackId", callbackId);
        params.putMap("arguments", arguments);
        callJsMethod(params);
    }

    private void callJsMethod(ReadableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("MethodCall", params);
    }
}
