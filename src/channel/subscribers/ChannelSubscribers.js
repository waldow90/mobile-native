import React, {
    Component
} from 'react';

import {
    StyleSheet,
    Platform,
    Text,
    FlatList,
    View,
    TouchableHighlight,
} from 'react-native';
import { ListItem, Avatar } from 'react-native-elements';

import {
  observer,
  inject
} from 'mobx-react/native'

import IonIcon from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Modal from 'react-native-modal'

import i18n from '../../common/services/i18n.service';
import DiscoveryUser from '../../discovery/DiscoveryUser';
import CenteredLoading from '../../common/components/CenteredLoading';
import { CommonStyle } from '../../styles/Common';
import colors from '../../styles/Colors';
import ErrorLoading from '../../common/components/ErrorLoading';

/**
 * Discovery screen
 */
export default
@inject('channelSubscribersStore')
@observer
class ChannelSubscribers extends Component {

  /**
   * On component will mount
   */
  componentWillMount() {
    this._loadData();
  }

  /**
   * On component will unmount
   */
  componentWillUnmount() {
    this.props.channelSubscribersStore.reset();
  }

  /**
   * Load data
   */
  _loadData() {
    const params = this.props.navigation.state.params;
    if (params.guid) {
      this.props.channelSubscribersStore.setGuid(params.guid);
    }
  }

  /**
   * Render
   */
  render() {
    let body;

    const store = this.props.channelSubscribersStore;

    const footerCmp = store.errorLoading ? (
      <ErrorLoading message={i18n.t('cantLoad')} tryAgain={store.loadList} />
    ) : null;

    if (!store.list.loaded && !store.list.refreshing && !store.errorLoading) {
      body = <CenteredLoading />;
    } else {
      body = (
        <FlatList
          data={store.list.entities.slice()}
          renderItem={this.renderRow}
          keyExtractor={item => item.guid}
          onRefresh={this.refresh}
          refreshing={store.list.refreshing}
          onEndReached={this.loadFeed}
          // onEndReachedThreshold={0}
          initialNumToRender={12}
          style={styles.listView}
          removeClippedSubviews={false}
          ListFooterComponent={footerCmp}
        />
      );
    }

    return (
      <View style={CommonStyle.flexContainer}>
        <View style={styles.topbar}>
          <View style={[CommonStyle.flexContainer, CommonStyle.rowJustifyCenter]}>
            <TouchableHighlight underlayColor='transparent' onPress={() => store.setFilter('subscribers')} style={store.filter == 'subscribers'? [styles.selectedButton, CommonStyle.flexContainerCenter]: [styles.buttons, CommonStyle.flexContainerCenter]}>
              <Text>{i18n.t('subscribers')}</Text>
            </TouchableHighlight>
            <TouchableHighlight underlayColor='transparent' onPress={() => store.setFilter('subscriptions')} style={store.filter == 'subscriptions'? [styles.selectedButton, CommonStyle.flexContainerCenter]: [styles.buttons, CommonStyle.flexContainerCenter ]}>
              <Text>{i18n.t('subscriptions')}</Text>
            </TouchableHighlight>
          </View>
        </View>
        {body}
      </View>
    );
  }

  /**
   * Load subs data
   */
  loadFeed = () => {
    this.props.channelSubscribersStore.loadList(this.props.guid);
  }

  /**
   * Refresh subs data
   */
  refresh = () => {
    this.props.channelSubscribersStore.refresh(this.props.guid)
  }

  /**
   * Render user row
   */
  renderRow = (row) => {
    return (
      <DiscoveryUser store={this.props.channelSubscribersStore} row={row} navigation={this.props.navigation} />
    );
  }
}

const styles = StyleSheet.create({
	listView: {
    backgroundColor: '#FFF',
    flex: 1,
  },
  topbar: {
    height:35,
    justifyContent: 'center',
    flexDirection: 'row',

  },

  buttons: {
    alignItems: 'center',
  },
  selectedButton: {
    alignItems: 'center',
    borderBottomWidth:3,
    borderColor: colors.primary
  },
});