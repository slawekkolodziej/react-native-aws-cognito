//
//  RNAWSCognitoBridge.m
//  ReactNativeAWSCognito
//
//  Created by Slawek Kolodziej on 02.03.2017.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import <AWSCore/AWSCore.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(RNAWSCognito, NSObject)

RCT_EXTERN_METHOD(
  setUserPool:(NSString *)regionName
  identityPoolId:(NSString *)identityPoolId
  clientId:(NSString *)clientId
  clientSecret:(NSString *)clientSecret
  poolId:(NSString *)poolId
);


RCT_EXTERN_METHOD(
  getSession:(NSString *)email
  password:(NSString *)password
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
);

RCT_EXTERN_METHOD(
  getCredentials:(NSString *)email
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
);

@end
