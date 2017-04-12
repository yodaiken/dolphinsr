(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('uuid')) :
	typeof define === 'function' && define.amd ? define(['exports', 'uuid'], factory) :
	(factory((global.dolphinsr = global.dolphinsr || {}),global.uuid));
}(this, (function (exports,uuid) { 'use strict';

uuid = 'default' in uuid ? uuid['default'] : uuid;

// Generally all types should be considered opaque in application code.

// -- Data types

function generateId() {
  return uuid.v4();
}

// numbers are indexes on master.fields

function getCardId(o) {
  return o.master + '#' + o.combination.front.join(',') + '@' + o.combination.back.join(',');
}

// -- Computed data types

function makeInitialCardState(master, combination) {
  return {
    master: master,
    combination: combination,

    mode: 'learning',
    consecutiveCorrect: 0,
    lastReviewed: null
  };
}

function makeEmptyState() {
  return {
    cardStates: {}
  };
}

// This function only works if reviews is always sorted by timestamp
function addReview(reviews, review) {
  if (!reviews.length) {
    return [review];
  }

  var i = reviews.length - 1;
  for (; i >= 0; i -= 1) {
    if (reviews[i].ts <= review.ts) {
      break;
    }
  }

  var newReviews = reviews.slice(0);
  newReviews.splice(i + 1, 0, review);

  return newReviews;
}

function dateDiffInDays(a, b) {
  // adapted from http://stackoverflow.com/a/15289883/251162
  var MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Disstate the time and time-zone information.
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return (utc2 - utc1) / MS_PER_DAY;
}

// assumes that the day starts at 3:00am in the local timezone
function calculateDueDate(state) {
  var result = new Date(state.lastReviewed);
  result.setHours(3, 0, 0);
  result.setDate(result.getDate() + Math.ceil(state.interval));
  return result;
}

function computeScheduleFromCardState(state, now) {
  if (state.mode === 'lapsed' || state.mode === 'learning') {
    return 'learning';
  } else if (state.mode === 'reviewing') {
    var diff = dateDiffInDays(calculateDueDate(state), now);
    if (diff < 0) {
      return 'later';
    } else if (diff >= 0 && diff < 1) {
      return 'due';
    } else if (diff >= 1) {
      return 'overdue';
    }
  }
  throw new Error('unreachable');
}

// Breaks ties first by last review (earlier beats later),
// then by an alphabetical comparison of the cardId (just so it stays 100% deterministic)
//
// Returns null if no cards are due.
function pickMostDue(s, state) {
  var prec = ['learning', 'overdue', 'due'];
  for (var i = 0; i < prec.length; i += 1) {
    var sched = prec[i];
    if (s[sched].length) {
      return s[sched].slice(0).sort(function (a, b) {
        var cardA = state.cardStates[a];
        var cardB = state.cardStates[b];
        if (cardA == null) {
          throw new Error('id not found in state: ' + a);
        }
        if (cardB == null) {
          throw new Error('id not found in state: ' + b);
        }

        var reviewDiff = cardA.lastReviewed == null && cardB.lastReviewed != null ? 1 : cardB.lastReviewed == null && cardA.lastReviewed != null ? -1 : cardA.lastReviewed == null && cardB.lastReviewed == null ? 0 : cardB.lastReviewed - cardA.lastReviewed;
        if (reviewDiff !== 0) {
          return -reviewDiff;
        }

        if (a === b) {
          throw new Error('comparing duplicate id: ' + a);
        }
        return b > a ? 1 : -1;
      })[0];
    }
  }
  return null;
}

function computeCardsSchedule(state, now) {
  var s = {
    learning: [],
    later: [],
    due: [],
    overdue: []
  };
  Object.keys(state.cardStates).forEach(function (cardId) {
    var cardState = state.cardStates[cardId];
    s[computeScheduleFromCardState(cardState, now)].push(getCardId(cardState));
  });
  return s;
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};





















var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var debug$1 = require('debug')('dolphin');

// -- applyToLearningCardState(...)

// constants from Anki defaults
// TODO(April 1, 2017) investigate rationales, consider changing them
var INITIAL_FACTOR = 2500;
var INITIAL_DAYS_WITHOUT_JUMP = 4;
var INITIAL_DAYS_WITH_JUMP = 1;
function applyToLearningCardState(prev, ts, rating) {
  if (rating === 'easy' || rating.match(/^easy|good$/) && prev.consecutiveCorrect > 0) {
    return {
      master: prev.master,
      combination: prev.combination,

      mode: 'reviewing',
      factor: INITIAL_FACTOR,
      lapses: 0,
      interval: prev.consecutiveCorrect > 0 ? INITIAL_DAYS_WITHOUT_JUMP : INITIAL_DAYS_WITH_JUMP,
      lastReviewed: ts
    };
  } else if (rating === 'again') {
    return {
      master: prev.master,
      combination: prev.combination,

      mode: 'learning',
      consecutiveCorrect: 0,
      lastReviewed: ts
    };
  } else if (rating.match(/^good|hard$/) && prev.consecutiveCorrect < 1) {
    return {
      master: prev.master,
      combination: prev.combination,

      mode: 'learning',
      consecutiveCorrect: prev.consecutiveCorrect + 1,
      lastReviewed: ts
    };
  }
  throw new Error('logic error');
}

// -- applyToReviewingCardState(...)

var EASY_BONUS = 2;
var MAX_INTERVAL = 365;
var MIN_FACTOR = 0; // TODO
var MAX_FACTOR = Number.MAX_VALUE;
function constrainWithin(min, max, n) {
  if (min > max) {
    throw new Error('min > max: ' + min + '=min, ' + max + '=max');
  }
  return Math.max(Math.min(n, max), min);
}

function calculateDaysLate(state, actual) {
  var expected = calculateDueDate(state);

  var daysLate = dateDiffInDays(actual, expected);

  if (daysLate < 0) {
    debug$1('last review occured earlier than expected', {
      daysLate: daysLate,
      actual: actual,
      expected: expected
    });
    return 0;
  }

  return daysLate;
}
function applyToReviewingCardState(prev, ts, rating) {
  if (rating === 'again') {
    return {
      master: prev.master,
      combination: prev.combination,

      mode: 'lapsed',
      consecutiveCorrect: 0,
      factor: constrainWithin(MIN_FACTOR, MAX_FACTOR, prev.factor - 200),
      lapses: prev.lapses + 1,
      interval: prev.interval,
      lastReviewed: ts
    };
  }
  var factorAdj = rating === 'hard' ? -150 : rating === 'good' ? 0 : rating === 'easy' ? 150 : NaN;
  var daysLate = calculateDaysLate(prev, ts);

  var ival = constrainWithin(prev.interval + 1, MAX_INTERVAL, rating === 'hard' ? (prev.interval + daysLate / 4) * 1.2 : rating === 'good' ? (prev.interval + daysLate / 2) * prev.factor / 1000 : rating === 'easy' ? (prev.interval + daysLate) * prev.factor / 1000 * EASY_BONUS : NaN);

  if (isNaN(factorAdj) || isNaN(ival)) {
    throw new Error('invalid rating: ' + rating);
  }

  return {
    master: prev.master,
    combination: prev.combination,

    mode: 'reviewing',
    factor: constrainWithin(MIN_FACTOR, MAX_FACTOR, prev.factor + factorAdj),
    lapses: prev.lapses,
    interval: ival,
    lastReviewed: ts
  };
}

// -- applyToLapsedCardState(...)

function applyToLapsedCardState(prev, ts, rating) {
  if (rating === 'easy' || rating.match(/^easy|good$/) && prev.consecutiveCorrect > 0) {
    return {
      master: prev.master,
      combination: prev.combination,

      mode: 'reviewing',
      factor: prev.factor,
      lapses: prev.lapses,
      interval: prev.consecutiveCorrect > 0 ? INITIAL_DAYS_WITHOUT_JUMP : INITIAL_DAYS_WITH_JUMP,
      lastReviewed: ts
    };
  }
  return {
    master: prev.master,
    combination: prev.combination,

    mode: 'lapsed',
    factor: prev.factor,
    lapses: prev.lapses,
    interval: prev.interval,
    lastReviewed: ts,
    consecutiveCorrect: rating === 'again' ? 0 : prev.consecutiveCorrect + 1
  };
}

// -- applyReview(...)


function applyToCardState(prev, ts, rating) {
  if (prev.lastReviewed != null && prev.lastReviewed > ts) {
    var p = prev.lastReviewed.toISOString();
    var t = ts.toISOString();
    throw new Error('cannot apply review before current lastReviewed: ' + p + ' > ' + t);
  }

  if (prev.mode === 'learning') {
    return applyToLearningCardState(prev, ts, rating);
  } else if (prev.mode === 'reviewing') {
    return applyToReviewingCardState(prev, ts, rating);
  } else if (prev.mode === 'lapsed') {
    return applyToLapsedCardState(prev, ts, rating);
  }
  throw new Error('invalid mode: ' + prev.mode);
}

function applyReview(prev, review) {
  var cardId = getCardId(review);

  var cardState = prev.cardStates[cardId];
  if (cardState == null) {
    throw new Error('applying review to missing card: ' + JSON.stringify(review));
  }

  var state = {
    cardStates: _extends({}, prev.cardStates)
  };
  state.cardStates[cardId] = applyToCardState(cardState, review.ts, review.rating);

  return state;
}

var debug = require('debug')('dolphin');

var DolphinSR = function () {

  // TODO(April 3, 2017)
  // Currently the cachedCardsSchedule is not invalidated when the time changes (only when a review
  // or master is added), so there is a possibility for cards not switching from due to overdue
  // properly. In practice, this has not been a significant issue -- easy fix for later.
  function DolphinSR() {
    var currentDateGetter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {
      return new Date();
    };
    classCallCheck(this, DolphinSR);

    this._state = makeEmptyState();
    this._masters = {};
    this._reviews = [];
    this._currentDateGetter = currentDateGetter;
  }

  // gotcha: does not invalidate cache, that happens in addMasters()


  // For testing, you can swap this out with a different function to change when 'now' is.


  createClass(DolphinSR, [{
    key: '_addMaster',
    value: function _addMaster(master) {
      var _this = this;

      if (this._masters[master.id]) {
        throw new Error('master already added: ' + master.id);
      }
      master.combinations.forEach(function (combination) {
        var id = getCardId({ master: master.id, combination: combination });
        _this._state.cardStates[id] = makeInitialCardState(master.id, combination);
      });
      this._masters[master.id] = master;
    }
  }, {
    key: 'addMasters',
    value: function addMasters() {
      var _this2 = this;

      for (var _len = arguments.length, masters = Array(_len), _key = 0; _key < _len; _key++) {
        masters[_key] = arguments[_key];
      }

      masters.forEach(function (master) {
        return _this2._addMaster(master);
      });
      this._cachedCardsSchedule = null;
    }

    // gotcha: does not apply the reviews to state or invalidate cache, that happens in addReviews()

  }, {
    key: '_addReviewToReviews',
    value: function _addReviewToReviews(review) {
      this._reviews = addReview(this._reviews, review);
      var lastReview = this._reviews[this._reviews.length - 1];

      return getCardId(lastReview) + '#' + lastReview.ts.toISOString() !== getCardId(review) + '#' + review.ts.toISOString();
    }

    // Returns true if the entire state was rebuilt (inefficient, minimize)

  }, {
    key: 'addReviews',
    value: function addReviews() {
      var _this3 = this;

      for (var _len2 = arguments.length, reviews = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        reviews[_key2] = arguments[_key2];
      }

      var needsRebuild = reviews.reduce(function (v, review) {
        if (_this3._addReviewToReviews(review)) {
          return true;
        }
        return v;
      }, false);

      if (needsRebuild) {
        this._rebuild();
      } else {
        reviews.forEach(function (review) {
          _this3._state = applyReview(_this3._state, review);
        });
      }

      this._cachedCardsSchedule = null;

      return needsRebuild;
    }
  }, {
    key: '_rebuild',
    value: function _rebuild() {
      debug('rebuilding state');
      var masters = this._masters;
      var reviews = this._reviews;
      this._masters = {};
      this._reviews = [];

      this.addMasters.apply(this, toConsumableArray(Object.keys(masters).map(function (k) {
        return masters[k];
      })));
      this.addReviews.apply(this, toConsumableArray(reviews));
    }
  }, {
    key: '_getCardsSchedule',
    value: function _getCardsSchedule() {
      if (this._cachedCardsSchedule != null) {
        return this._cachedCardsSchedule;
      }
      this._cachedCardsSchedule = computeCardsSchedule(this._state, this._currentDateGetter());
      return this._cachedCardsSchedule;
    }
  }, {
    key: '_nextCardId',
    value: function _nextCardId() {
      var s = this._getCardsSchedule();
      return pickMostDue(s, this._state);
    }
  }, {
    key: '_getCard',
    value: function _getCard(id) {
      var _id$split = id.split('#'),
          _id$split2 = slicedToArray(_id$split, 2),
          masterId = _id$split2[0],
          combo = _id$split2[1];

      var _combo$split$map = combo.split('@').map(function (part) {
        return part.split(',').map(function (x) {
          return parseInt(x, 10);
        });
      }),
          _combo$split$map2 = slicedToArray(_combo$split$map, 2),
          front = _combo$split$map2[0],
          back = _combo$split$map2[1];

      var master = this._masters[masterId];
      if (master == null) {
        throw new Error('cannot getCard: no such master: ' + masterId);
      }
      var combination = { front: front, back: back };

      var frontFields = front.map(function (i) {
        return master.fields[i];
      });
      var backFields = back.map(function (i) {
        return master.fields[i];
      });

      return {
        master: masterId,
        combination: combination,

        front: frontFields,
        back: backFields
      };
    }
  }, {
    key: 'nextCard',
    value: function nextCard() {
      var cardId = this._nextCardId();
      if (cardId == null) {
        return null;
      }
      return this._getCard(cardId);
    }
  }, {
    key: 'summary',
    value: function summary() {
      var s = this._getCardsSchedule();
      return {
        due: s.due.length,
        later: s.later.length,
        learning: s.learning.length,
        overdue: s.overdue.length
      };
    }
  }]);
  return DolphinSR;
}();

exports.generateId = generateId;
exports.DolphinSR = DolphinSR;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=bundle.js.map
