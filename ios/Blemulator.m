#import "Blemulator.h"


@implementation Blemulator

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"MethodCall"];
}

RCT_EXPORT_METHOD(sampleMethod:(NSString *)stringArgument numberParameter:(nonnull NSNumber *)numberArgument callback:(RCTResponseSenderBlock)callback)
{
    // TODO: Implement some actually useful functionality
    callback(@[[NSString stringWithFormat: @"numberArgument: %@ stringArgument: %@", numberArgument, stringArgument]]);
    [self sendEventWithName:@"MethodCall" body:@{@"name": stringArgument}];
}

RCT_EXPORT_METHOD(runTest)
{
    [self sendEventWithName:@"MethodCall" body:@{@"name": @"runTest"}];
}


@end
