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

import AWSConfig from './aws.json';
import { getSignedUrl } from 'aws-signing-utils';

import init from 'react_native_mqtt';

const AWSCognito = NativeModules.RNAWSCognito;


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

  getUrl(credentials, tokens) {
    const urlOptions = {
      method: 'GET',
      protocol: 'wss',
      canonicalUri: '/mqtt',
      service: 'iotdevicegateway',
      region: AWSConfig.region,
      secretKey: credentials.secretKey,
      accessKey: credentials.accessKey,
      sessionKey: credentials.sessionKey,
      host: AWSConfig.endpointAddress,
    };

    return getSignedUrl(urlOptions);
  }

  connectToMqtt(credentials, tokens) {
    console.log(credentials, tokens);
    const clientUrl = this.getUrl(credentials, tokens)

    console.log({ clientUrl });

    init({
      size: 10000,
      storageBackend: AsyncStorage,
      defaultExpires: 1000 * 3600 * 24,
      enableCache: true,
      sync : {
      }
    });

    const client = new Paho.MQTT.Client(clientUrl, AWSConfig.mqttTopic);

    function onConnect() {
      console.log("onConnect");

      client.subscribe(AWSConfig.mqttTopic, {
        onSuccess: function(){
          console.log('subscribed to '+ AWSConfig.mqttTopic);
        },
        onFailure: function(){
          console.log('subscription failed');
        }
      });

      var message = new Paho.MQTT.Message("Hello from react-native");
      message.destinationName = AWSConfig.mqttTopic;
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
      timeout: 30,
      mqttVersion: 4,
      onSuccess: onConnect,
      onFailure: function(err) {
        console.log('connectionLost', err.errorMessage);
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
