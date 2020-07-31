#import <Foundation/Foundation.h>

typedef void (^JsCallback)(id result);

@interface JsCallHandler : NSObject

- (instancetype)init;

- (NSString*)addCallback:(JsCallback)callback;

- (void)handleReturnCallWithId:(NSString *)callId
                          args:(NSDictionary*)args;

@end
