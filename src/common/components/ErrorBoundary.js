
import React, {
  Component
} from 'react';

import {
  Text,
  StyleSheet,
  Clipboard,
  Alert,
  View
} from 'react-native';
import { CommonStyle as CS } from '../../styles/Common';
import logService from '../services/log.service';
import i18n from '../services/i18n.service';

/**
 * Error boundary
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logService.exception(error);
    this.error = error;
    this.info = info;
  }

  copy = () => {
    Clipboard.setString((this.error.message || this.error) + '\nSTACK:\n'+ this.info.componentStack);
    Alert.alert(i18n.t('stacktraceCopied'));
  }

  getErrorMessage() {
    const {
      containerStyle,
      textSmall
    } = this.props;

    return (
      <View style={[CS.columnAlignCenter, containerStyle]}>
        <Text style={[textSmall ? CS.fontS : CS.fontM, CS.textCenter, CS.marginTop2x, CS.fontHairline, CS.colorDanger]} onPress={this.copy}>{this.props.message || i18n.t('errorDisplaying')}</Text>
        <Text style={[textSmall ? CS.fontXS : CS.fontS, CS.textCenter, CS.marginTop2x, CS.marginBottom2x, CS.fontHairline]} onPress={this.copy}>{i18n.t('tapCopyError')}</Text>
      </View>
    );
  }

  /**
   * Render
   */
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.getErrorMessage();
    }

    return this.props.children;
  }
}


/**
 * With error boundary HOC
 * @param {Component} WrappedComponent
 * @param {string} message
 * @param {boolean} small
 */
export const withErrorBoundary = (WrappedComponent, message = null, small = false) => (
  (props) => {
    if (!message) message = i18n.t('errorDisplaying');
    return (
      <ErrorBoundary message={message} small={small}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }
);

/**
 * With error boundary HOC
 *
 * This method copy the static properties needed by react navigation screens
 *
 * @param {Component} WrappedComponent
 * @param {string} message
 * @param {boolean} small
 */
export const withErrorBoundaryScreen = (WrappedComponent, message = null, small = false) => {

  class hoc extends React.Component {

    render() {
      if (!message) message = i18n.t('errorDisplaying');
      return (
        <ErrorBoundary message={message} small={small}>
          <WrappedComponent {...this.props} />
        </ErrorBoundary>
      );
    }
  }
  hoc.navigationOptions = WrappedComponent.navigationOptions;
  hoc.router = WrappedComponent.router;

  return hoc;
}
