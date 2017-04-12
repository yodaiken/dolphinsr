// @flow

import uuid from 'uuid';

// Generally all types should be considered opaque in application code.

// -- Data types

export type Id = string;
export function generateId(): Id {
  return uuid.v4();
}

export type Field = string;

// numbers are indexes on master.fields
export type Combination = {front: number[], back: number[], };

export type CardId = string;
export function getCardId(o: {master: Id, combination: Combination}): CardId {
  return `${o.master}#${o.combination.front.join(',')}@${o.combination.back.join(',')}`;
}


export type Master = {
  id: Id,
  fields: Array<Field>,
  combinations: Array<Combination>,
}

export type Rating = 'easy' | 'good' | 'hard' | 'again';

export type Review = {
  master: Id,
  combination: Combination,
  ts: Date,
  rating: Rating,
}

// -- Computed data types

export type Card = {
  master: Id,
  combination: Combination,
  front: Field[],
  back: Field[]
};

export type LearningCardState = {
  master: Id,
  combination: Combination,

  mode: 'learning',
  consecutiveCorrect: number, // 0 <= consecutiveCorrect < 2, int
  lastReviewed: ?Date
};
export type ReviewingCardState = {
  master: Id,
  combination: Combination,

  mode: 'reviewing',
  factor: number, // float
  lapses: number, // int
  interval: number, // days since lastReviewed
  lastReviewed: Date
};
export type LapsedCardState = {
  master: Id,
  combination: Combination,

  mode: 'lapsed',
  consecutiveCorrect: number,
  factor: number,
  lapses: number,
  interval: number,
  lastReviewed: Date,
};
export type CardState = LearningCardState | ReviewingCardState | LapsedCardState;
export function makeInitialCardState(master: Id, combination: Combination): LearningCardState {
  return {
    master,
    combination,

    mode: 'learning',
    consecutiveCorrect: 0,
    lastReviewed: null,
  };
}

export type State = {
  cardStates: {[CardId]: CardState},
};
export function makeEmptyState(): State {
  return {
    cardStates: {},
  };
}

export type Schedule = 'later' | 'due' | 'overdue' | 'learning';
export function cmpSchedule(a: Schedule, b: Schedule) {
  const scheduleVals = {
    later: 0,
    due: 1,
    overdue: 2,
    learning: 3,
  };
  const diff = scheduleVals[b] - scheduleVals[a];
  if (diff < 0) {
    return -1;
  } else if (diff > 0) {
    return 1;
  }
  return 0;
}

export type CardsSchedule = {
  'later': Array<CardId>,
  'due': Array<CardId>,
  'overdue': Array<CardId>,
  'learning': Array<CardId>
};

export type SummaryStatistics = {
  'later': number,
  'due': number,
  'overdue': number,
  'learning': number
};
