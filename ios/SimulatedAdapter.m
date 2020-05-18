#import "SimulatedAdapter.h"
#import "Util/BlemulatorCommonTypes.h"

@interface SimulatedAdapter () <BleAdapter>

@property NSString *logLevelValue;

@end

@implementation SimulatedAdapter

@synthesize delegate;

-(instancetype)initWithString:(NSString*) logLevel {
    self = [super init];
    if (self) {
        self.logLevelValue = @"None";
        //createClient
    }
    return self;
}

// MARK: - Adapter Methods - BleClient lifecycle

- (nonnull instancetype)initWithQueue:(dispatch_queue_t _Nonnull)queue
                 restoreIdentifierKey:(NSString * _Nullable)restoreIdentifierKey {
    return [SimulatedAdapter new];
}

- (void)invalidate {
    NSLog(@"SimulatedAdapter.invalidate");
}

- (void)startDeviceScan:(NSArray<NSString *> * _Nullable)filteredUUIDs
                options:(NSDictionary<NSString *,id> * _Nullable)options {
    NSLog(@"SimulatedAdapter.startDeviceScan");
}

-(void)stopDeviceScan {
    NSLog(@"SimulatedAdapter.stopDeviceScan");
}

// MARK: - Adapter Methods -  BT state monitoring

- (void)enable:(NSString * _Nonnull)transactionId
       resolve:(NS_NOESCAPE Resolve)resolve
        reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.enable");
}

- (void)disable:(NSString * _Nonnull)transactionId
    resolve:(NS_NOESCAPE Resolve)resolve
     reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.disable");
}

- (void)state:(NS_NOESCAPE Resolve)resolve
       reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.state");
}

// MARK: - Adapter Methods -  Connection

- (void)connectToDevice:(NSString * _Nonnull)deviceIdentifier
                options:(NSDictionary<NSString *,id> * _Nullable)options
                resolve:(Resolve)resolve
                 reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.connectToDevice");
}

- (void)cancelDeviceConnection:(NSString * _Nonnull)deviceIdentifier
                   resolve:(Resolve)resolve
                    reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.cancelDeviceConnection");
}

- (void)isDeviceConnected:(NSString * _Nonnull)deviceIdentifier
              resolve:(NS_NOESCAPE Resolve)resolve
               reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.isDeviceConnected");
}

- (void)requestConnectionPriorityForDevice:(NSString * _Nonnull)deviceIdentifier
                        connectionPriority:(NSInteger)connectionPriority
                             transactionId:(NSString * _Nonnull)transactionId
                                   resolve:(Resolve)resolve
                                    reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.requestConnectionPriorityForDevice");
}

// MARK: - Adapter Methods - Log Level

- (void)setLogLevel:(NSString * _Nonnull)logLevel {
    NSLog(@"setLogLevel: %@", logLevel);
    self.logLevelValue = logLevel;
}

- (void)logLevel:(NS_NOESCAPE Resolve)resolve
          reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.logLevel");
    resolve(self.logLevelValue);
}

// MARK: - Adapter Methods - Discovery

- (void)servicesForDevice:(NSString * _Nonnull)deviceIdentifier
                  resolve:(NS_NOESCAPE Resolve)resolve
                   reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.servicesForDevice");
}

- (void)discoverAllServicesAndCharacteristicsForDevice:(NSString * _Nonnull)deviceIdentifier
                                     transactionId:(NSString * _Nonnull)transactionId
                                           resolve:(Resolve)resolve
                                            reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.discoverAllServicesAndCharacteristicsForDevice");
}

- (void)characteristicsForDevice:(NSString * _Nonnull)deviceIdentifier
                 serviceUUID:(NSString * _Nonnull)serviceUUID
                     resolve:(NS_NOESCAPE Resolve)resolve
                      reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.characteristicsForDevice");
}

- (void)characteristicsForService:(double)serviceIdentifier
                      resolve:(NS_NOESCAPE Resolve)resolve
                       reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.characteristicsForService");
}

- (void)descriptorsForDevice:(NSString *)deviceIdentifier
             serviceUUID:(NSString *)serviceUUID
      characteristicUUID:(NSString *)characteristicUUID
                 resolve:(NS_NOESCAPE Resolve)resolve
                  reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.descriptorsForDevice");
}

- (void)descriptorsForService:(double)serviceIdentifier
       characteristicUUID:(NSString *)characteristicUUID
                  resolve:(NS_NOESCAPE Resolve)resolve
                   reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.descriptorsForService");
}

- (void)descriptorsForCharacteristic:(double)characteristicIdentifier
                             resolve:(NS_NOESCAPE Resolve)resolve
                              reject:(NS_NOESCAPE Reject)reject {
    NSLog(@"SimulatedAdapter.descriptorsForCharacteristic");
}

// MARK: - Adapter Methods - Characteristics operations

- (void)readCharacteristicForDevice:(NSString * _Nonnull)deviceIdentifier
                    serviceUUID:(NSString * _Nonnull)serviceUUID
             characteristicUUID:(NSString * _Nonnull)characteristicUUID
                  transactionId:(NSString * _Nonnull)transactionId
                        resolve:(Resolve)resolve
                         reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readCharacteristicForDevice");
}

- (void)readCharacteristicForService:(double)serviceIdentifier
              characteristicUUID:(NSString * _Nonnull)characteristicUUID
                   transactionId:(NSString * _Nonnull)transactionId
                         resolve:(Resolve)resolve
                          reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readCharacteristicForService");
}

- (void)readCharacteristic:(double)characteristicIdentifier
         transactionId:(NSString * _Nonnull)transactionId
               resolve:(Resolve)resolve
                reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readCharacteristic");
}

- (void)writeCharacteristicForDevice:(NSString * _Nonnull)deviceIdentifier
                     serviceUUID:(NSString * _Nonnull)serviceUUID
              characteristicUUID:(NSString * _Nonnull)characteristicUUID valueBase64:(NSString * _Nonnull)valueBase64
                        response:(BOOL)response
                   transactionId:(NSString * _Nonnull)transactionId
                         resolve:(Resolve)resolve
                          reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.writeCharacteristicForDevice");
}

- (void)writeCharacteristicForService:(double)serviceIdentifier
               characteristicUUID:(NSString * _Nonnull)characteristicUUID
                      valueBase64:(NSString * _Nonnull)valueBase64
                         response:(BOOL)response
                    transactionId:(NSString * _Nonnull)transactionId
                          resolve:(Resolve)resolve
                           reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.writeCharacteristicForService");
}

- (void)writeCharacteristic:(double)characteristicIdentifier
            valueBase64:(NSString * _Nonnull)valueBase64
               response:(BOOL)response
          transactionId:(NSString * _Nonnull)transactionId
                resolve:(Resolve)resolve reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.writeCharacteristic");
}

- (void)monitorCharacteristicForDevice:(NSString * _Nonnull)deviceIdentifier
                       serviceUUID:(NSString * _Nonnull)serviceUUID
                characteristicUUID:(NSString * _Nonnull)characteristicUUID
                     transactionId:(NSString * _Nonnull)transactionId
                           resolve:(Resolve)resolve
                            reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.monitorCharacteristicForDevice");
}

- (void)monitorCharacteristicForService:(double)serviceIdentifier
                 characteristicUUID:(NSString * _Nonnull)characteristicUUID
                      transactionId:(NSString * _Nonnull)transactionId
                            resolve:(Resolve)resolve
                             reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.monitorCharacteristicForService");
}

- (void)monitorCharacteristic:(double)characteristicIdentifier
            transactionId:(NSString * _Nonnull)transactionId
                  resolve:(Resolve)resolve
                   reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.monitorCharacteristic");
}

// MARK: - Adapter Methods - Descriptors

- (void)readDescriptor:(double)descriptorID
         transactionId:(NSString *)transactionId
               resolve:(Resolve)resolve
                reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readDescriptor");
}

- (void)readDescriptorForCharacteristic:(double)characteristicID
                         descriptorUUID:(NSString *)descriptorUUID
                          transactionId:(NSString *)transactionId
                                resolve:(Resolve)resolve
                                 reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readDescriptorForCharacteristic");
}

- (void)readDescriptorForService:(double)serviceId
              characteristicUUID:(NSString *)characteristicUUID
                  descriptorUUID:(NSString *)descriptorUUID
                   transactionId:(NSString *)transactionId
                         resolve:(Resolve)resolve
                          reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readDescriptorForService");
}

- (void)readDescriptorForDevice:(NSString *)deviceIdentifier
                    serviceUUID:(NSString *)serviceUUID
             characteristicUUID:(NSString *)characteristicUUID
                 descriptorUUID:(NSString *)descriptorUUID
                  transactionId:(NSString *)transactionId
                        resolve:(Resolve)resolve
                         reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readDescriptorForDevice");
}

- (void)writeDescriptor:(double)descriptorID
  valueBase64:(NSString *)valueBase64
transactionId:(NSString *)transactionId
      resolve:(Resolve)resolve
       reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.writeDescriptor");
}

- (void)writeDescriptorForCharacteristic:(double)characteristicID
                          descriptorUUID:(NSString *)descriptorUUID
                             valueBase64:(NSString *)valueBase64
                           transactionId:(NSString *)transactionId
                                 resolve:(Resolve)resolve
                                  reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.writeDescriptorForCharacteristic");
}

- (void)writeDescriptorForService:(double)serviceID
               characteristicUUID:(NSString *)characteristicUUID
                   descriptorUUID:(NSString *)descriptorUUID
                      valueBase64:(NSString *)valueBase64
                    transactionId:(NSString *)transactionId
                          resolve:(Resolve)resolve
                           reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.writeDescriptorForService");
}

- (void)writeDescriptorForDevice:(NSString *)deviceIdentifier
                     serviceUUID:(NSString *)serviceUUID
              characteristicUUID:(NSString *)characteristicUUID
                  descriptorUUID:(NSString *)descriptorUUID
                     valueBase64:(NSString *)valueBase64
                   transactionId:(NSString *)transactionId
                         resolve:(Resolve)resolve
                          reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.writeDescriptorForDevice");
}

// MARK: - Adapter Methods - Known / Connected devices

- (void)devices:(NSArray<NSString *> * _Nonnull)deviceIdentifiers
        resolve:(Resolve)resolve
         reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.devices");
}

- (void)connectedDevices:(NSArray<NSString *> * _Nonnull)serviceUUIDs
             resolve:(Resolve)resolve
              reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.connectedDevices");
}

// MARK: - Adapter Methods - MTU

- (void)requestMTUForDevice:(NSString * _Nonnull)deviceIdentifier
                        mtu:(NSInteger)mtu
              transactionId:(NSString * _Nonnull)transactionId
                    resolve:(Resolve)resolve
                     reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.requestMTUForDevice");
}

// MARK: - Adapter Methods - RSSI

- (void)readRSSIForDevice:(NSString * _Nonnull)deviceIdentifier
            transactionId:(NSString * _Nonnull)transactionId
                  resolve:(Resolve)resolve
                   reject:(Reject)reject {
    NSLog(@"SimulatedAdapter.readRSSIForDevice");
}

// MARK: - Adapter Methods - Cancel transaction

- (void)cancelTransaction:(NSString * _Nonnull)transactionId {
    NSLog(@"SimulatedAdapter.cancelTransaction");
}

@end
