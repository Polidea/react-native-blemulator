#import "JsCallHandler.h"

@interface JsCallHandler()

@property (nonatomic) int nextCallbackId;
@property (nonatomic) NSMutableDictionary<NSString*, JsCallback>* callbacks;

@end

@implementation JsCallHandler

- (instancetype)init {
    self = [super init];
    if (self) {
        self.nextCallbackId = 0;
        self.callbacks = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (NSString*)addCallback:(JsCallback)callback {
    NSString* id = [NSString stringWithFormat:@"%d", self.nextCallbackId++];
    [self.callbacks setObject:callback forKey:id];
    return id;
}

- (void)handleReturnCallWithId:(NSString *)callId
                          args:(NSDictionary*)args {
    JsCallback callback = [self.callbacks objectForKey:callId];
    if (callback != nil) {
        callback(args);
        [self.callbacks removeObjectForKey:callId];
    } else {
        NSException* exception = [NSException exceptionWithName:@"Illegal state"
                                                         reason:@"Non-existent callback requested"
                                                       userInfo:nil] ;
        @throw exception;
    }
}
@end
