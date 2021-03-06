import React, {
  Component
} from 'react';

import {
  View,
} from 'react-native';

import { ComponentsStyle } from './styles/Components';
import { CommonStyle } from './styles/Common';

export default class LoadingScreen extends Component {

  static navigationOptions = {
    header: null
  }

  render() {
    return (
      <View style={[CommonStyle.backgroundWhite ,CommonStyle.flexContainerCenter, CommonStyle.padding2x]}/>
    );
  }
}