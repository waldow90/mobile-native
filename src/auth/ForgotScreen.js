import React, {
  Component
} from 'react';


import {
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import { CommonStyle as CS } from '../styles/Common';

/**
 * Forgot screen
 */
export default class ForgotScreen extends Component {
  /**
   * Disable navigation bar
   */
  static navigationOptions = {
    header: null,
  };

  /**
   * Render
   */
  render() {
    const code =
      this.props.navigation.state.params &&
      this.props.navigation.state.params.code;

    return (
      <KeyboardAvoidingView style={[CS.flexContainer, CS.backgroundThemePrimary]} behavior={ Platform.OS == 'ios' ? 'padding' : null }>
        <View style={[CS.flexContainer, CS.padding2x]}>
          {code ? <ResetPassword
            onBack={this.onForgotBack}
          /> :
          <ForgotPassword
            onBack={this.onForgotBack}
          />}
        </View>
      </KeyboardAvoidingView>
    );
  }

  /**
   * On press back
   */
  onForgotBack = () => {
    this.props.navigation.goBack();
  };
}
