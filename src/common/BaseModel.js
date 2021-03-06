import {observable, action, computed, toJS} from 'mobx';
import _ from 'lodash';
import {Alert} from 'react-native';
import EventEmitter from 'eventemitter3';

import sessionService from './services/session.service';
import {vote} from './services/votes.service';
import {toggleExplicit} from '../newsfeed/NewsfeedService';
import logService from './services/log.service';
import {revokeBoost, acceptBoost, rejectBoost} from '../boost/BoostService';
import {toggleAllowComments as toggleAllow} from '../comments/CommentsService';
import i18n from './services/i18n.service';
import featuresService from './services/features.service';

/**
 * Base model
 */
export default class BaseModel {
  /**
   * Event emitter
   */
  static events = new EventEmitter();

  /**
   * Enable/Disable comments
   */
  @observable allow_comments = true;

  /**
   * Entity permissions
   */
  @observable.ref permissions = {};

  /**
   * List reference (if the entity belongs to one)
   * @var {OffsetListStore}
   */
  __list = null;

  /**
   *  List reference setter
   */
  set _list(value) {
    this.__list = value;
  }

  /**
   *  List reference getter
   */
  get _list() {
    return this.__list;
  }

  @action
  removeFromList() {
    if (this._list) {
      this._list.remove(this);
    }
  }

  toPlainObject() {
    const plainEntity = toJS(this);

    // remove references to the list
    delete plainEntity.__list;

    return plainEntity;
  }

  /**
   * Child models classes
   */
  childModels() {
    return {};
  }

  /**
   * Constructor
   */
  constructor(data) {
    Object.assign(this, data);

    // Some users have a number as username and engine return them as a number
    if (this.username) {
      this.username = this.username.toString();
    }

    // create childs instances
    const childs = this.childModels();
    for (var prop in childs) {
      if (this[prop]) {
        this[prop] = childs[prop].create(this[prop]);
      }
    }
  }

  /**
   * Return if the current user is the owner of the activity
   */
  isOwner = () => {
    return this.ownerObj && sessionService.guid === this.ownerObj.guid;
  };

  /**
   * Update model data
   * @param {Object} data
   */
  @action
  update(data) {
    const childs = this.childModels();

    Object.getOwnPropertyNames(this).forEach(key => {
      if (data[key] !== undefined) {
        if (childs[key] && this[key] && this[key].update) {
          // we update the child model
          this[key].update(data[key]);
        } else {
          // we assign the property
          this[key] = data[key];
        }
      }
    });
  }

  /**
   * Create an instance
   * @param {object} data
   */
  static create(data) {
    return new this(data);
  }

  /**
   * Create an array of instances
   * @param {array} arrayData
   */
  static createMany(arrayData) {
    const collection = [];
    if (!arrayData) return collection;

    arrayData.forEach(data => {
      collection.push(new this(data));
    });

    return collection;
  }

  /**
   * Check if data is an instance of the model and if it is not
   * returns a new instance
   * @param {object} data
   */
  static checkOrCreate(data) {
    if (data instanceof this) {
      return data;
    }
    return this.create(data);
  }

  /**
   * Get a property of the model if it exist or undefined
   * @param {string|array} property ex: 'ownerObj.merchant.exclusive.intro'
   */
  @action
  get(property) {
    return _.get(this, property);
  }

  /**
   * voted up
   */
  @computed
  get votedUp() {
    if (
      this['thumbs:up:user_guids'] &&
      this['thumbs:up:user_guids'].length &&
      this['thumbs:up:user_guids'].indexOf(sessionService.guid) >= 0
    ) {
      return true;
    }
    return false;
  }

  /**
   * voted down
   */
  @computed
  get votedDown() {
    if (
      this['thumbs:down:user_guids'] &&
      this['thumbs:down:user_guids'].length &&
      this['thumbs:down:user_guids'].indexOf(sessionService.guid) >= 0
    ) {
      return true;
    }
    return false;
  }

  /**
   * Toggle vote
   * @param {string} direction
   */
  @action
  async toggleVote(direction) {
    const voted = direction == 'up' ? this.votedUp : this.votedDown;
    const delta = voted ? -1 : 1;

    const guids = this['thumbs:' + direction + ':user_guids'] || [];

    if (voted) {
      this['thumbs:' + direction + ':user_guids'] = guids.filter(function(
        item,
      ) {
        return item !== sessionService.guid;
      });
    } else {
      this['thumbs:' + direction + ':user_guids'] = [
        sessionService.guid,
        ...guids,
      ];
    }

    this['thumbs:' + direction + ':count'] =
      parseInt(this['thumbs:' + direction + ':count'], 10) + delta;

    const params = this.getClientMetadata();

    try {
      await vote(this.guid, direction, params);
    } catch (err) {
      if (!voted) {
        this['thumbs:' + direction + ':user_guids'] = guids.filter(function(
          item,
        ) {
          return item !== sessionService.guid;
        });
      } else {
        this['thumbs:' + direction + ':user_guids'] = [
          sessionService.guid,
          ...guids,
        ];
      }
      this['thumbs:' + direction + ':count'] =
        parseInt(this['thumbs:' + direction + ':count'], 10) - delta;
      throw err;
    }
  }

  getClientMetadata() {
    return this._list && this._list.metadataService
      ? this._list.metadataService.getEntityMeta(this)
      : {};
  }

  /**
   * Block owner
   */
  blockOwner() {
    if (!this.ownerObj) throw new Error('This entity has no owner');
    return this.ownerObj.toggleBlock(true);
  }

  /**
   * Unblock owner
   */
  unblockOwner() {
    if (!this.ownerObj) throw new Error('This entity has no owner');
    return this.ownerObj.toggleBlock(false);
  }

  @action
  async toggleExplicit() {
    let value = !this.mature;
    try {
      await toggleExplicit(this.guid, value);
      this.mature = value;
    } catch (err) {
      this.mature = !value;
      logService.exception('[BaseModel]', err);
      throw err;
    }
  }

  @action
  async reject() {
    try {
      await rejectBoost(this.guid);
      this.state = 'rejected';
    } catch (err) {
      logService.exception('[BaseModel]', err);
      throw err;
    }
  }

  @action
  async accept() {
    try {
      await acceptBoost(this.guid);
      this.state = 'accepted';
    } catch (err) {
      logService.exception('[BaseModel]', err);
      throw err;
    }
  }

  @action
  async revoke(filter) {
    try {
      await revokeBoost(this.guid, filter);
      this.state = 'revoked';
    } catch (err) {
      logService.exception('[BaseModel]', err);
      throw err;
    }
  }

  @action
  async toggleAllowComments() {
    const data = await toggleAllow(this.guid, !this.allow_comments);
    this.allow_comments = !this.allow_comments;
  }

  @action
  setPermissions(permissions) {
    this.permissions = permissions;
  }

  /**
   * Check if the current user can perform an action with the entity
   * @param {string} action
   * @param {boolean} showAlert Show an alert message if the action is not allowed
   * @returns {boolean}
   */
  can(action, showAlert = false) {
    // TODO: clean up permissions feature flag
    if (!featuresService.has('permissions')) return true;

    let allowed = true;

    if (!this.permissions || !this.permissions.permissions) {
      allowed = false;
    } else {
      allowed = this.permissions.permissions.some(item => item === action);
    }

    if (showAlert && !allowed) {
      Alert.alert(
        i18n.t('sorry'),
        i18n.t(`permissions.notAllowed.${action}`, {
          defaultValue: i18n.t('notAllowed'),
        }),
      );
    }

    return allowed;
  }

  isScheduled() {
    return this.time_created * 1000 > Date.now();
  }

  /**
   * Check if awaiting for moderation
   */
  isPending() {
    return this.pending && this.pending !== '0'; // asking like this because front does the same
  }

  static isScheduled(timeCreatedValue) {
    let response = false;

    if (timeCreatedValue) {
      timeCreatedValue = new Date(timeCreatedValue);
      response = timeCreatedValue.getTime() > Date.now();
    }

    return response;
  }
}
