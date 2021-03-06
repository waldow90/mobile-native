import React, {
  Component
} from 'react';

import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  inject,
  observer
} from 'mobx-react/native'

import Icon from 'react-native-vector-icons/Ionicons';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { CommonStyle } from '../../../styles/Common';
import colors from '../../../styles/Colors';

import abbrev from '../../../common/helpers/abbrev';
import token from '../../../common/helpers/token';
import number from '../../../common/helpers/number';

/**
 * Activity metrics component
 */
@observer
export default class ActivityMetrics extends Component {

  /**
   * Render
   */
  render() {
    const entity = this.props.entity;

    if (!entity.wire_totals) {
      return <View />;
    }

    return (
      <View style={[CommonStyle.rowJustifyCenter]}>
        <View style={[
          CommonStyle.rowJustifyStart,
          CommonStyle.borderRadius4x,
          CommonStyle.border,
          CommonStyle.borderHair,
          CommonStyle.borderGreyed,
          CommonStyle.paddingLeft,
          CommonStyle.paddingRight,
          CommonStyle.backgroundLight,
          styles.container
        ]}>
          <View style={[CommonStyle.rowJustifyCenter, CommonStyle.alignCenter]}>
            <Text style={styles.counter}>{abbrev(token(entity.wire_totals.tokens), 0)} <Icon name="ios-flash" color={'#777'}/></Text>
          </View>
          <View style={[CommonStyle.rowJustifyCenter, CommonStyle.alignCenter]}>
            <Text style={[styles.counter]}> · </Text>
            <Text style={styles.counter}>{number(entity.impressions, 0)} <McIcon name="eye" color={'#777'}/></Text>
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  counter: {
    color: '#777',
    alignItems: 'center',
    fontSize: 11,
  },
  container: {
    paddingVertical:2,
    borderBottomWidth:0,
    borderBottomLeftRadius:0,
    borderBottomRightRadius:0
  }
})
