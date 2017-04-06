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
  View
} from 'react-native';

import hash from 'hash.js';
import AWSSignature from 'react-native-aws-signature';
import AWSConfig from './aws.json';

import { Client, Message } from 'react-native-paho-mqtt';

const AWSCognito = NativeModules.RNAWSCognito;

// TODO: refactor
const myStorage = {
  setItem: (key, item) => {
    myStorage[key] = item;
  },
  getItem: (key) => myStorage[key],
  removeItem: (key) => {
    delete myStorage[key];
  },
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
      .then( () => AWSCognito.getCredentials(AWSConfig.email) )
      .then( credentials => this.connectToMqtt(credentials) )
      .catch( err => console.error('Error: ', err) )
  }

  connectToMqtt(credentials) {
    const host = `${AWSConfig.endpointAddress}.iot.${AWSConfig.region}.amazonaws.com`;

    const datetime = (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '')
    const date = datetime.substr(0, 8);
    const method = 'GET';
    const protocol = 'wss';
    const uri = '/mqtt';
    const service = 'iotdevicegateway';
    const algorithm = 'AWS4-HMAC-SHA256';

    const credentialScope = date + '/' + AWSConfig.region + '/' + service + '/' + 'aws4_request';

    let canonicalQuerystring = 'X-Amz-Algorithm=' + algorithm;
    canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(credentials.accessKey + '/' + credentialScope);
    canonicalQuerystring += '&X-Amz-Date=' + datetime;
    canonicalQuerystring += '&X-Amz-SignedHeaders=host';

    const canonicalHeaders = 'host:' + host + '\n';
    const payloadHash = hash.sha256().update('').digest('hex')
    const canonicalRequest = method + '\n' + uri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash;


    const awsSignature = new AWSSignature();
    awsSignature.setParams({
      path: '/?Param2=value2&Param1=value1',
        method: 'get',
        service: 'service',
        headers: {
            'X-Amz-Date': (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, ''),
            'host': host
        },
      region: AWSConfig.region,
      body: '',
      credentials: {
        SecretKey: credentials.secretKey,
        AccessKeyId: credentials.accessKey,
      }
    });

    const signature = awsSignature.getSignature();

    canonicalQuerystring += '&X-Amz-Signature=' + signature;
    canonicalQuerystring += '&X-Amz-Security-Token=' + encodeURIComponent(credentials.sessionKey);

    const clientUrl = protocol + '://' + host + uri + '?' + canonicalQuerystring;

    const client = new Client({
      uri: clientUrl,
      clientId: 'react-native-demo',
      storage: myStorage
    });

    client.on('connectionLost', (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log(responseObject.errorMessage);
      }
    });
    client.on('messageReceived', (message) => {
      console.log(message.payloadString);
    });

    // connect the client
    client.connect()
      .then(() => {
        // Once a connection has been made, make a subscription and send a message.
        console.log('onConnect');
        return client.subscribe('World');
      })
      .then(() => {
        const message = new Message('Hello');
        message.destinationName = 'World';
        client.send(message);
      })
      .catch((responseObject) => {
        if (responseObject.errorCode !== 0) {
          console.log('onConnectionLost:' + responseObject.errorMessage);
        }
      })
    ;

    // const authorization = awsSignature.getAuthorizationHeader();

    // console.log(url, credentials, signature, authorization);

    // const mqttClient = new AWSMqtt({
    //   accessKeyId: credentials.accessKey,
    //   secretAccessKey: credentials.secretKey,
    //   sessionToken: credentials.sessionKey,
    //   endpointAddress: AWSConfig.endpointAddress,
    //   region: AWSConfig.region,
    // });

    // mqttClient.on('connect', () => {
    //   mqttClient.subscribe('test-topic');
    //   console.log('connected to iot mqtt websocket');
    // });
    // mqttClient.on('message', (topic, message) => {
    //   console.log('Got message:', message.toString());
    // });
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
