#import <Foundation/Foundation.h>
#import "JsCallHandler"

typedef void (^JsCallback)(id result);

@interface PlatformToJsBridge : NSObject

- (instancetype)initWithJsCallHandler:(JsCallHandler*)jsCallHandler;

- (NSString*)addCallback:(JsCallback)callback;

- (void)handleReturnCallWithId:(NSString *)callId
                          args:(NSDictionary*)args;

@end
