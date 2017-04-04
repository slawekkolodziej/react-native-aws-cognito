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

import AWSConfig from './aws.json';

const AWSCognito = NativeModules.RNAWSCognito;

export default class ReactNativeAWSCognito extends Component {
  componentDidMount() {
    console.dir(AWSCognito.setUserPool(
      AWSConfig.region,
      AWSConfig.identityPoolId,
      AWSConfig.clientId,
      undefined,
      AWSConfig.userPoolId
    ) );

    AWSCognito.getSession(AWSConfig.email, AWSConfig.password)
      .then( resp => {
        AWSCognito.getCredentials(AWSConfig.email)
          .then( resp => {
            console.log(resp);
          })
          .catch( err => {
            console.error(err)
          } )
      } )
      .catch( err => {
        console.log('error :-(');
        console.log(err)
      } )
  }

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
