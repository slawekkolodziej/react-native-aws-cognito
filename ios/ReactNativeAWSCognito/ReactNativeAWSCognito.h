//
//  ReactNativeAWSCognito.h
//  ReactNativeAWSCognito
//
//  Created by Slawek Kolodziej on 14.04.2017.
//
//

#import <React/RCTBridgeModule.h>
#import <AWSCore/AWSCore.h>
#import <AWSCognito/AWSCognito.h>
#import <AWSCognitoIdentityProvider/AWSCognitoIdentityProvider.h>

@interface ReactNativeAWSCognito : NSObject <RCTBridgeModule>

@property AWSCognitoIdentityUser *user;
@property AWSCognitoIdentityUserPool *userPool;
@property AWSRegionType *region;
@property NSString *identityPoolId;

@end
