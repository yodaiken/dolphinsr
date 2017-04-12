// @flow

import computeCardsSchedule, {
  calculateDueDate, computeScheduleFromCardState, pickMostDue,
} from '../lib/computeCardsSchedule';
import { generateId, makeEmptyState, getCardId } from '../lib/types';
import type { LearningCardState, LapsedCardState, ReviewingCardState } from '../lib/types';
import * as dates from './dates';

describe('calculateDueDate()', () => {
  it('should add a rounded interval to the lastReviewed, set at 3am', () => {
    const state: ReviewingCardState = {
      master: generateId(),
      combination: { front: [0], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.today,
      factor: 1000,
      interval: 13.3,
      lapses: 0,
    };

    const due = calculateDueDate(state);
    expect(due).toEqual(dates.addToDate(dates.todayAt3AM, 14));
  });
});

describe('computeScheduleFromCardState', () => {
  it('should return learning for lapsed and learning cards');
  it('should return later for cards that are reviewing and not yet due', () => {
    const state: ReviewingCardState = {
      master: generateId(),
      combination: { front: [0], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.today,
      factor: 1000,
      interval: 13.3,
      lapses: 0,
    };
    // due in 14 days
    expect(computeScheduleFromCardState(state, dates.laterTmrw)).toEqual('later');
  });
  it('should return due for cards that are reviewing and due within the day', () => {
    const state: ReviewingCardState = {
      master: generateId(),
      combination: { front: [0], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.today,
      factor: 1000,
      interval: 13.3,
      lapses: 0,
    };
    // due in 14 days
    expect(computeScheduleFromCardState(state, dates.addToDate(dates.todayAt3AM, 14))).toEqual('due');
    expect(computeScheduleFromCardState(state, dates.addToDate(dates.laterToday, 14))).toEqual('due');
  });
  it('should return overdue for cards that reviewing and due before the day', () => {
    const state: ReviewingCardState = {
      master: generateId(),
      combination: { front: [0], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.today,
      factor: 1000,
      interval: 13.3,
      lapses: 0,
    };
    // due in 14 days
    expect(computeScheduleFromCardState(state, dates.addToDate(dates.todayAt3AM, 15))).toEqual('overdue');
    expect(computeScheduleFromCardState(state, dates.addToDate(dates.laterToday, 15))).toEqual('overdue');
  });
});

describe('computeCardsSchedule()', () => {
  it('should return an empty schedule when passed an empty state', () => {
    expect(computeCardsSchedule(makeEmptyState(), dates.today)).toEqual({
      learning: [],
      later: [],
      due: [],
      overdue: [],
    });
  });
  it('should a sorted list of cards when passed cards in multiple states', () => {
    const state = makeEmptyState();
    const master = generateId();
    const dueLater: ReviewingCardState = {
      master,
      combination: { front: [0], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.laterTmrw,
      factor: 1000,
      interval: 13.3,
      lapses: 0,
    };
    const dueNow: ReviewingCardState = {
      master,
      combination: { front: [0, 1], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.laterTmrw,
      factor: 1000,
      interval: 0,
      lapses: 0,
    };
    const overDue: ReviewingCardState = {
      master,
      combination: { front: [1], back: [0] },

      mode: 'reviewing',
      lastReviewed: dates.today,
      factor: 1000,
      interval: 0,
      lapses: 0,
    };
    const learning: LearningCardState = {
      master,
      combination: { front: [1, 0], back: [0] },
      mode: 'learning',
      consecutiveCorrect: 0,
      lastReviewed: dates.today,
    };
    const lapsed: LapsedCardState = {
      master,
      combination: { front: [1, 0], back: [0, 1] },
      mode: 'lapsed',
      consecutiveCorrect: 0,
      lastReviewed: dates.today,
      factor: 1000,
      interval: 0,
      lapses: 1,
    };

    [dueLater, dueNow, overDue, learning, lapsed].forEach((cardState) => {
      state.cardStates[getCardId(cardState)] = cardState;
    });

    const s = computeCardsSchedule(state, dates.laterTmrw);
    expect(s.learning.length).toEqual(2);
    expect(s.learning).toContainEqual(getCardId(lapsed));
    expect(s.learning).toContain(getCardId(learning));
    expect(s.later).toEqual([getCardId(dueLater)]);
    expect(s.due).toEqual([getCardId(dueNow)]);
    expect(s.overdue).toEqual([getCardId(overDue)]);
  });
});

describe('pickMostDue()', () => {
  it('should return null when passed an empty schedule and state', () => {
    const state = makeEmptyState();
    const sched = computeCardsSchedule(state, dates.today);
    expect(pickMostDue(sched, state)).toBeNull();
  });
  it('should return the learning card reviewed most recently if two learning cards are in the deck', () => {
    const state = makeEmptyState();
    const master = generateId();
    const dueLater: ReviewingCardState = {
      master,
      combination: { front: [0], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.laterTmrw,
      factor: 1000,
      interval: 13.3,
      lapses: 0,
    };
    const dueNow: ReviewingCardState = {
      master,
      combination: { front: [0, 1], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.laterTmrw,
      factor: 1000,
      interval: 0,
      lapses: 0,
    };
    const overDue: ReviewingCardState = {
      master,
      combination: { front: [1], back: [0] },

      mode: 'reviewing',
      lastReviewed: dates.today,
      factor: 1000,
      interval: 0,
      lapses: 0,
    };
    const learning: LearningCardState = {
      master,
      combination: { front: [1, 0], back: [0] },
      mode: 'learning',
      consecutiveCorrect: 0,
      lastReviewed: dates.today,
    };
    const lapsed: LapsedCardState = {
      master,
      combination: { front: [1, 0], back: [0, 1] },
      mode: 'lapsed',
      consecutiveCorrect: 0,
      lastReviewed: dates.laterTmrw,
      factor: 1000,
      interval: 0,
      lapses: 1,
    };

    [dueLater, dueNow, overDue, learning, lapsed].forEach((cardState) => {
      state.cardStates[getCardId(cardState)] = cardState;
    });

    const s = computeCardsSchedule(state, dates.laterTmrw);

    expect(pickMostDue(s, state)).toEqual(getCardId(learning));
  });
  it('should return the learning card with the "greater" string ID on second tie break', () => {
    const state = makeEmptyState();
    const master = generateId();
    const dueLater: ReviewingCardState = {
      master,
      combination: { front: [0], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.laterTmrw,
      factor: 1000,
      interval: 13.3,
      lapses: 0,
    };
    const dueNow: ReviewingCardState = {
      master,
      combination: { front: [0, 1], back: [1] },

      mode: 'reviewing',
      lastReviewed: dates.laterTmrw,
      factor: 1000,
      interval: 0,
      lapses: 0,
    };
    const overDue: ReviewingCardState = {
      master,
      combination: { front: [1], back: [0] },

      mode: 'reviewing',
      lastReviewed: dates.today,
      factor: 1000,
      interval: 0,
      lapses: 0,
    };
    const learning: LearningCardState = {
      master,
      combination: { front: [1, 0], back: [0] },
      mode: 'learning',
      consecutiveCorrect: 0,
      lastReviewed: dates.today,
    };
    const lapsed: LapsedCardState = {
      master,
      combination: { front: [1, 0], back: [0, 1] },
      mode: 'lapsed',
      consecutiveCorrect: 0,
      lastReviewed: dates.today,
      factor: 1000,
      interval: 0,
      lapses: 1,
    };

    [dueLater, dueNow, overDue, learning, lapsed].forEach((cardState) => {
      state.cardStates[getCardId(cardState)] = cardState;
    });

    const s = computeCardsSchedule(state, dates.laterTmrw);


    expect(pickMostDue(s, state)).toEqual(
      getCardId(lapsed) > getCardId(learning) ? getCardId(lapsed) : getCardId(learning),
    );
  });
});
