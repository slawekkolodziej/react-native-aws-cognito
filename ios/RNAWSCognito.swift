//
//  RNAWSCognito.swift
//  ReactNativeAWSCognito
//
//  Created by Slawek Kolodziej on 02.03.2017.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation
import AWSCore
import AWSCognito
import AWSCognitoIdentityProvider
import AWSIoT

@objc(RNAWSCognito)
class RNAWSCognito: NSObject {
  
  private var user: AWSCognitoIdentityUser? = nil

  private var userPool: AWSCognitoIdentityUserPool? = nil
  
  private var credentialsProvider: AWSCredentialsProvider? = nil
  
  private func getRegion(regionName: String) -> AWSRegionType {
    switch regionName {
      case "us-east-1":
        return AWSRegionType.USEast1
      case "us-west-1":
        return AWSRegionType.USWest1
      case "us-west-2":
        return AWSRegionType.USWest2
      case "eu-west-1":
        return AWSRegionType.EUWest1
      case "eu-central-1":
        return AWSRegionType.EUCentral1
      case "ap-southeast-1":
        return AWSRegionType.APSoutheast1
      case "ap-southeast-2":
        return AWSRegionType.APSoutheast2
      case "ap-northeast-1":
        return AWSRegionType.APNortheast1
      case "sa-east-1":
        return AWSRegionType.SAEast1
      case "cn-north-1":
        return AWSRegionType.CNNorth1
      default:
        return AWSRegionType.Unknown
    }
  }
  
  private func getTime(date: Any) -> Double {
    if let dateObj = date as? Date {
      return round(dateObj.timeIntervalSince1970 * 1000)
    } else {
      return 0
    }
  }
  
  
  @objc func setUserPool(_ regionName: String, identityPoolId: String, clientId: String, clientSecret: String?, poolId: String) -> Void {
    let region = self.getRegion(regionName: regionName)
    
    self.credentialsProvider = AWSCognitoCredentialsProvider(
      regionType: region,
      identityPoolId: identityPoolId
//      identityProviderManager: self.userPool
    )
    
    let servicePoolConfiguration = AWSServiceConfiguration(
      region: region,
      credentialsProvider: self.credentialsProvider
    )
  
    AWSServiceManager.default().defaultServiceConfiguration = servicePoolConfiguration
    
    let userPoolConfiguration = AWSCognitoIdentityUserPoolConfiguration(
      clientId: clientId,
      clientSecret: clientSecret,
      poolId: poolId
    )
    
    AWSCognitoIdentityUserPool.register(
      with: servicePoolConfiguration,
      userPoolConfiguration: userPoolConfiguration,
      forKey: "UserPool"
    )
    
    self.userPool = AWSCognitoIdentityUserPool(forKey: "UserPool")
    
//    self.credentialsProvider = AWSCognitoCredentialsProvider(
//      regionType: region,
//      identityPoolId: identityPoolId,
//      identityProviderManager: self.userPool
//    )
  }
  
  
  @objc func getSession(_
    email: String,
    password: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {

    self.user = userPool?.getUser(email)
    self.user?.getSession(email, password: password, validationData: nil)
      .continueWith(block: { (task: AWSTask!) -> AnyObject! in
        if let error = task.error as? NSError {
          print("Error: \(error)")
          reject("error", "\(error)", error);
        } else {
          let expirationTime = self.getTime(date: task.result?.expirationTime)
          
          let result: [String: Any] = [
            "accessToken": task.result?.accessToken?.tokenString,
            "idToken": task.result?.idToken?.tokenString,
            "refreshToken": task.result?.refreshToken?.tokenString,
            "expirationTime": expirationTime
          ]
          resolve(result)
        }

        return nil
      })
  }
  

  @objc func getCredentials(_
    email: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
    
    //      .credentials()
    self.credentialsProvider?.credentials()
      .continueWith(block: { (task: AWSTask!) -> AnyObject! in
        if let error = task.error as? NSError {
          reject("error", "\(error)", error);
        } else {
          let expirationTime = self.getTime(date: task.result?.expiration)
          
          let result: [String: Any] = [
            "accessKey": task.result?.accessKey,
            "secretKey": task.result?.secretKey,
            "sessionKey": task.result?.sessionKey,
            "expirationTime": expirationTime
          ]
          resolve(result)
          
//          print("Success: \(task.result)")
//          resolve("\(task.result)");
        }
        
        return nil
      })
  }
}
