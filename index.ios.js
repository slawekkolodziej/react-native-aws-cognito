/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  NativeModules,
  StyleSheet,
  Text,
  View,
  AsyncStorage,
} from 'react-native';
import moment from 'moment';

import AWSConfig from './aws.json';

import init from 'react_native_mqtt';

import CryptoJS from 'crypto-js';


const AWSCognito = NativeModules.RNAWSCognito;



function SigV4Utils(){};

SigV4Utils.sign = function(key, msg){
  var hash = CryptoJS.HmacSHA256(msg, key);
  return hash.toString(CryptoJS.enc.Hex);
};

SigV4Utils.sha256 = function(msg) {
  var hash = CryptoJS.SHA256(msg);
  return hash.toString(CryptoJS.enc.Hex);
};

SigV4Utils.getSignatureKey = function(key, dateStamp, regionName, serviceName) {
  var kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key);
  var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
  var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
  var kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
  return kSigning;
};




export default class ReactNativeAWSCognito extends Component {
  componentDidMount() {
    AWSCognito.setUserPool(
      AWSConfig.region,
      AWSConfig.identityPoolId,
      AWSConfig.clientId,
      undefined,
      AWSConfig.userPoolId
    );

    AWSCognito.getSession(AWSConfig.email, AWSConfig.password)
      .then( tokens => Promise.all([
        AWSCognito.getCredentials(AWSConfig.email),
        tokens,
      ]) )
      .then( ([credentials, tokens]) => this.connectToMqtt(credentials, tokens) )
      .catch( err => console.error('Error: ', err) )
  }

  computeUrl(credentials, tokens) {
    const time = moment.utc();
    const dateStamp = time.format('YYYYMMDD');
    const amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z';

    const method = 'GET';
    const protocol = 'wss';
    const canonicalUri = '/mqtt';
    const service = 'iotdevicegateway';
    const algorithm = 'AWS4-HMAC-SHA256';
    const region = AWSConfig.region;
    const secretKey = AWSConfig.secretKey;
    const accessKey = AWSConfig.accessKey;
    const host = AWSConfig.endpointAddress;

    var credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';
    var canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
    canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(accessKey + '/' + credentialScope);
    canonicalQuerystring += '&X-Amz-Date=' + amzdate;
    canonicalQuerystring += '&X-Amz-Expires=86400';
    canonicalQuerystring += '&X-Amz-SignedHeaders=host';

    const canonicalHeaders = 'host:' + host + '\n';
    const payloadHash = SigV4Utils.sha256('');
    const canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash;
    console.log('canonicalRequest ' + canonicalRequest);

    var stringToSign = algorithm + '\n' +  amzdate + '\n' +  credentialScope + '\n' +  SigV4Utils.sha256(canonicalRequest);
    var signingKey = SigV4Utils.getSignatureKey(secretKey, dateStamp, region, service);
    console.log('stringToSign-------');
    console.log(stringToSign);
    console.log('------------------');
    console.log('signingKey ' + signingKey);
    var signature = SigV4Utils.sign(signingKey, stringToSign);

    canonicalQuerystring += '&X-Amz-Signature=' + signature;
    return 'wss://' + host + canonicalUri + '?' + canonicalQuerystring;
  }

  connectToMqtt(credentials, tokens) {
    const clientUrl = this.computeUrl(credentials, tokens)

    console.log({ clientUrl });

    init({
      size: 10000,
      storageBackend: AsyncStorage,
      defaultExpires: 1000 * 3600 * 24,
      enableCache: true,
      sync : {
      }
    });

    const TOPIC = 'test';

    const client = new Paho.MQTT.Client(clientUrl, 'unique_client_name');

    function onConnect() {
      console.log("onConnect");

      client.subscribe(TOPIC, {
        onSuccess: function(){
          console.log('subscribed to '+ TOPIC);
        },
        onFailure: function(){
          console.log('subscription failed');
        }
      });

      var message = new Paho.MQTT.Message("Hello from react-native");
      message.destinationName = TOPIC;
      client.send(message);
    }

    client.onConnectionLost = function onConnectionLost(responseObject) {
      console.log("onConnectionLost")
      if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:"+responseObject.errorMessage);
      }
    }

    client.onMessageArrived = function onMessageArrived(message) {
      console.log("onMessageArrived:"+message.payloadString);
    }

    client.connect({
      useSSL: true,
      timeout: 3,
      mqttVersion:4,
      onSuccess: onConnect,
      onFailure: function() {
        console.log('connectionLost');
      }
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('ReactNativeAWSCognito', () => ReactNativeAWSCognito);
