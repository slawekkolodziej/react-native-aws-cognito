//
//  ReactNativeAWSCognito.m
//  ReactNativeAWSCognito
//
//  Created by Slawek Kolodziej on 14.04.2017.
//
//

#import "ReactNativeAWSCognito.h"

@implementation ReactNativeAWSCognito


RCT_EXPORT_MODULE(ReactNativeAWSCognito);


- (AWSRegionType)getRegionBy:(NSString*)regionName {
    AWSRegionType regionType = AWSRegionUnknown;

    if ([regionName isEqualToString:@"us-east-1"]) {
        return AWSRegionUSEast1;
    } else if ([regionName isEqualToString:@"us-west-1"]) {
        return AWSRegionUSWest1;
    } else if ([regionName isEqualToString:@"us-west-2"]) {
        return AWSRegionUSWest2;
    } else if ([regionName isEqualToString:@"eu-west-1"]) {
        return AWSRegionEUWest1;
    } else if ([regionName isEqualToString:@"eu-central-1"]) {
        return AWSRegionEUCentral1;
    } else if ([regionName isEqualToString:@"ap-southeast-1"]) {
        return AWSRegionAPSoutheast1;
    } else if ([regionName isEqualToString:@"ap-southeast-2"]) {
        return AWSRegionAPSoutheast2;
    } else if ([regionName isEqualToString:@"ap-northeast-1"]) {
        return AWSRegionAPNortheast1;
    } else if ([regionName isEqualToString:@"sa-east-1"]) {
        return AWSRegionSAEast1;
    } else if ([regionName isEqualToString:@"cn-north-1"]) {
        return AWSRegionCNNorth1;
    }

    return AWSRegionUnknown;
}


- (NSTimeInterval)getTime:(NSDate*)date {
    return [date timeIntervalSince1970] * 1000;
}


RCT_EXPORT_METHOD(setUserPool:(NSString*)regionName
                  identityPoolId:(NSString*)identityPoolId
                  clientId:(NSString*)clientId
                  clientSecret:(NSString*)clientSecret
                  poolId:(NSString*)poolId
) {
    self.region = [self getRegionBy:regionName];
    self.identityPoolId = identityPoolId;

    AWSCognitoIdentityUserPoolConfiguration *userPoolConfiguration = [[AWSCognitoIdentityUserPoolConfiguration alloc]
                                                                      initWithClientId:clientId
                                                                      clientSecret:clientSecret
                                                                      poolId:poolId];

    AWSServiceConfiguration *serviceConfiguration = [[AWSServiceConfiguration alloc]
                                                     initWithRegion:self.region
                                                     credentialsProvider:nil];

    [AWSCognitoIdentityUserPool registerCognitoIdentityUserPoolWithConfiguration:serviceConfiguration
                                userPoolConfiguration:userPoolConfiguration
                                forKey:@"UserPool"];

    self.userPool = [AWSCognitoIdentityUserPool CognitoIdentityUserPoolForKey:@"UserPool"];
}


RCT_EXPORT_METHOD(getSession:(NSString*)email
                  password:(NSString*)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
) {
    self.user = [self.userPool getUser:email];

    [[self.user getSession:email password:password validationData:nil] continueWithBlock:^id _Nullable(AWSTask<AWSCognitoIdentityUserSession *> * _Nonnull task) {
            if (task.error) {
                reject(task.error.userInfo[@"__type"],
                       task.error.userInfo[@"message"],
                       [[NSError alloc] init]);
            } else {
                NSNumber *expirationTime = [NSNumber numberWithDouble:[self getTime:task.result.expirationTime]];

                NSDictionary *result = @{
                                         @"idToken": task.result.idToken.tokenString,
                                         @"accessToken": task.result.accessToken.tokenString,
                                         @"refreshToken": task.result.refreshToken.tokenString,
                                         @"expirationTime": expirationTime
                                        };
                resolve(result);
            }

        return nil;
    }];
}


RCT_EXPORT_METHOD(getCredentials:(NSString*)email
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
) {
    AWSCognitoCredentialsProvider *credentialsProvider = [[AWSCognitoCredentialsProvider alloc]
                                                          initWithRegionType:self.region
                                                          identityPoolId:self.identityPoolId
                                                          identityProviderManager:self.userPool];

    [[credentialsProvider credentials] continueWithBlock:^id _Nullable(AWSTask<AWSCredentials *> * _Nonnull task) {
        if (task.error) {
            reject(task.error.userInfo[@"__type"],
                   task.error.userInfo[@"message"],
                   [[NSError alloc] init]);
        } else {
            NSNumber *expirationTime = [NSNumber numberWithDouble:[self getTime:task.result.expiration]];

            NSDictionary *result = @{
                                     @"accessKey": task.result.accessKey,
                                     @"secretKey": task.result.secretKey,
                                     @"sessionKey": task.result.sessionKey,
                                     @"expirationTime": expirationTime
                                    };

            resolve(result);
        }
        return nil;
    }];
}


RCT_EXPORT_METHOD(createUser:(NSString*)username
                  password:(NSString*)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
) {
    AWSCognitoIdentityUserAttributeType * email = [AWSCognitoIdentityUserAttributeType new];
    email.name = @"email";
    email.value = username;

    [[self.userPool signUp:username password:password userAttributes:@[email] validationData:nil] continueWithBlock:^id _Nullable(AWSTask<AWSCognitoIdentityUserPoolSignUpResponse *> * _Nonnull task) {

        dispatch_async(dispatch_get_main_queue(), ^{
            if(task.error){
                NSError *error = nil;

                reject(task.error.userInfo[@"__type"],
                       task.error.userInfo[@"message"],
                       error);

            }else {
                NSDictionary *result = @{
                                         @"username": username,
                                         @"userConfirmed": task.result.userConfirmed
                                         };

                resolve(result);
            }});
        return nil;
    }];
}


@end
