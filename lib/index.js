// @flow

import type {
  State, Master, Review, Id, CardId, CardsSchedule, Card, SummaryStatistics,
} from './types';
import { makeEmptyState, getCardId, makeInitialCardState, generateId } from './types';
import addReview from './addReview';
import applyReview from './applyReview';
import computeCardsSchedule, { pickMostDue } from './computeCardsSchedule';

export type { Master, Review, Id, Card, SummaryStatistics };
export { generateId };

const debug = require('debug')('dolphin');

export class DolphinSR {

  _state: State;
  _masters: {[Id]: Master};
  _reviews: Array<Review>;

  // TODO(April 3, 2017)
  // Currently the cachedCardsSchedule is not invalidated when the time changes (only when a review
  // or master is added), so there is a possibility for cards not switching from due to overdue
  // properly. In practice, this has not been a significant issue -- easy fix for later.
  _cachedCardsSchedule: ?CardsSchedule;

  // For testing, you can swap this out with a different function to change when 'now' is.
  _currentDateGetter: () => Date;


  constructor(currentDateGetter: () => Date = () => new Date()) {
    this._state = makeEmptyState();
    this._masters = {};
    this._reviews = [];
    this._currentDateGetter = currentDateGetter;
  }

  // gotcha: does not invalidate cache, that happens in addMasters()
  _addMaster(master: Master) {
    if (this._masters[master.id]) {
      throw new Error(`master already added: ${master.id}`);
    }
    master.combinations.forEach((combination) => {
      const id = getCardId({ master: master.id, combination });
      this._state.cardStates[id] = makeInitialCardState(master.id, combination);
    });
    this._masters[master.id] = master;
  }

  addMasters(...masters: Array<Master>) {
    masters.forEach(master => this._addMaster(master));
    this._cachedCardsSchedule = null;
  }

  // gotcha: does not apply the reviews to state or invalidate cache, that happens in addReviews()
  _addReviewToReviews(review: Review): boolean {
    this._reviews = addReview(this._reviews, review);
    const lastReview = this._reviews[this._reviews.length - 1];

    return (
      `${getCardId(lastReview)}#${lastReview.ts.toISOString()}` !==
      `${getCardId(review)}#${review.ts.toISOString()}`
    );
  }

  // Returns true if the entire state was rebuilt (inefficient, minimize)
  addReviews(...reviews: Array<Review>): boolean {
    const needsRebuild = reviews.reduce((v, review) => {
      if (this._addReviewToReviews(review)) {
        return true;
      }
      return v;
    }, false);

    if (needsRebuild) {
      this._rebuild();
    } else {
      reviews.forEach((review) => {
        this._state = applyReview(this._state, review);
      });
    }

    this._cachedCardsSchedule = null;

    return needsRebuild;
  }

  _rebuild() {
    debug('rebuilding state');
    const masters = this._masters;
    const reviews = this._reviews;
    this._masters = {};
    this._reviews = [];

    this.addMasters(...Object.keys(masters).map(k => masters[k]));
    this.addReviews(...reviews);
  }

  _getCardsSchedule(): CardsSchedule {
    if (this._cachedCardsSchedule != null) {
      return this._cachedCardsSchedule;
    }
    this._cachedCardsSchedule = computeCardsSchedule(this._state, this._currentDateGetter());
    return this._cachedCardsSchedule;
  }

  _nextCardId(): ?CardId {
    const s = this._getCardsSchedule();
    return pickMostDue(s, this._state);
  }

  _getCard(id: CardId): Card {
    const [masterId, combo] = id.split('#');
    const [front, back] = combo.split('@').map(part => part.split(',').map(x => parseInt(x, 10)));
    const master = this._masters[masterId];
    if (master == null) {
      throw new Error(`cannot getCard: no such master: ${masterId}`);
    }
    const combination = { front, back };

    const frontFields = front.map(i => master.fields[i]);
    const backFields = back.map(i => master.fields[i]);

    return {
      master: masterId,
      combination,

      front: frontFields,
      back: backFields,
    };
  }

  nextCard(): ?Card {
    const cardId = this._nextCardId();
    if (cardId == null) {
      return null;
    }
    return this._getCard(cardId);
  }

  summary(): SummaryStatistics {
    const s = this._getCardsSchedule();
    return {
      due: s.due.length,
      later: s.later.length,
      learning: s.learning.length,
      overdue: s.overdue.length,
    };
  }
}
