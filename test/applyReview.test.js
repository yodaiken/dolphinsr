// @flow

import applyReview from '../lib/applyReview';
import { generateId, makeEmptyState, makeInitialCardState, getCardId } from '../lib/types';
import { calculateDueDate } from '../lib/computeCardsSchedule';
import type { Master } from '../lib/types';

import * as dates from './dates';

it('should throw an error if adding a review to an empty state', () => {
  const state = makeEmptyState();
  const id = generateId();
  expect(() => {
    applyReview(state, {
      master: id, combination: { front: [], back: [] }, rating: 'easy', ts: dates.today,
    });
  }).toThrowError();
});

it('should error if adding a review to a state with a lastReviewed later than the review', () => {
  const state = makeEmptyState();
  const id = generateId();
  const master: Master = {
    id,
    combinations: [
      { front: [0], back: [1] },
    ],
    fields: ['field 1', 'field 2'],
  };

  const combination = master.combinations[0];
  const cardId = getCardId({ master: id, combination });
  state.cardStates[cardId] = makeInitialCardState(id, combination);
  const newState = applyReview(state, {
    master: id, combination, rating: 'easy', ts: dates.laterToday,
  });

  // should be OK
  applyReview(state, {
    master: id, combination, rating: 'easy', ts: dates.today,
  });

  expect(() => {
    applyReview(newState, {
      master: id, combination, rating: 'easy', ts: dates.today,
    });
  }).toThrowError();
});

it('should not error when adding a review to a state with the given master and combination', () => {
  const state = makeEmptyState();

  const id = generateId();
  const master: Master = {
    id,
    combinations: [
      { front: [0], back: [1] },
    ],
    fields: ['field 1', 'field 2'],
  };

  const combination = master.combinations[0];

  state.cardStates[getCardId({ master: id, combination })] = makeInitialCardState(id, combination);

  applyReview(state, {
    master: id, combination, rating: 'easy', ts: dates.today,
  });
});
it('should not mutate the state when adding a review to a state with the given master and combination', () => {
  const state = makeEmptyState();

  const id = generateId();
  const master: Master = {
    id,
    combinations: [
      { front: [0], back: [1] },
    ],
    fields: ['field 1', 'field 2'],
  };

  const combination = master.combinations[0];

  state.cardStates[getCardId({ master: id, combination })] = makeInitialCardState(id, combination);
  const stateCopy = { ...state };

  applyReview(state, {
    master: id, combination, rating: 'easy', ts: dates.today,
  });

  expect(state).toEqual(stateCopy);
});
it('should return a new state reflecting the rating when adding a review to a state with the given master and combination', () => {
  const state = makeEmptyState();

  const id = generateId();
  const master: Master = {
    id,
    combinations: [
      { front: [0], back: [1] },
    ],
    fields: ['field 1', 'field 2'],
  };

  const combination = master.combinations[0];

  state.cardStates[getCardId({ master: id, combination })] = makeInitialCardState(id, combination);

  const newState = applyReview(state, {
    master: id, combination, rating: 'good', ts: dates.today,
  });

  expect(newState.cardStates[getCardId({ master: id, combination })]).toEqual({
    master: id,
    combination,

    consecutiveCorrect: 1,
    lastReviewed: dates.today,
    mode: 'learning',
  });
});
it('should accurately navigate through learning, reviewing, and lapsed modes', () => {
  const state = makeEmptyState();

  const id = generateId();
  const master: Master = {
    id,
    combinations: [
      { front: [0], back: [1] },
    ],
    fields: ['field 1', 'field 2'],
  };

  const combination = master.combinations[0];
  const cardId = getCardId({ master: id, combination });

  state.cardStates[cardId] = makeInitialCardState(id, combination);

  const stateB = applyReview(state, {
    master: id, combination, rating: 'good', ts: dates.today,
  });

  expect(stateB.cardStates[cardId]).toEqual({
    master: id,
    combination,

    consecutiveCorrect: 1,
    lastReviewed: dates.today,
    mode: 'learning',
  });

  const stateC = applyReview(stateB, {
    master: id, combination, rating: 'easy', ts: dates.laterToday,
  });

  expect(stateC.cardStates[cardId]).toEqual({
    master: id,
    combination,

    lastReviewed: dates.laterToday,
    mode: 'reviewing',
    factor: 2500,
    interval: 4,
    lapses: 0,
  });

  const stateCDue = calculateDueDate((stateC.cardStates[cardId]: any));
  expect(stateCDue).toEqual(dates.addToDate(dates.todayAt3AM, 4));

  const stateD = applyReview(stateC, {
    master: id, combination, rating: 'easy', ts: stateCDue,
  });
  expect(stateD.cardStates[cardId]).toEqual({
    master: id,
    combination,

    lastReviewed: stateCDue,
    mode: 'reviewing',
    factor: 2650,
    interval: 20,
    lapses: 0,
  });

  const stateDDue = calculateDueDate((stateD.cardStates[cardId]: any));

  const stateE = applyReview(stateD, {
    master: id, combination, rating: 'again', ts: stateDDue,
  });
  expect(stateE.cardStates[cardId]).toEqual({
    master: id,
    combination,

    consecutiveCorrect: 0,
    factor: 2450,
    lapses: 1,
    interval: 20,
    lastReviewed: stateDDue,
    mode: 'lapsed',
  });

  const eReviewDate = dates.addToDate(stateDDue, 1);

  const stateF = applyReview(stateE, {
    master: id, combination, rating: 'again', ts: eReviewDate,
  });
  expect(stateF.cardStates[cardId]).toEqual({
    master: id,
    combination,

    consecutiveCorrect: 0,
    factor: 2450,
    lapses: 1,
    interval: 20,
    lastReviewed: eReviewDate,
    mode: 'lapsed',
  });

  const gReviewDate = dates.addToDate(stateDDue, 1);
  const stateG = applyReview(stateF, {
    master: id, combination, rating: 'easy', ts: gReviewDate,
  });
  expect(stateG.cardStates[cardId]).toEqual({
    master: id,
    combination,

    lastReviewed: gReviewDate,
    mode: 'reviewing',
    factor: 2450,
    interval: 1,
    lapses: 1,
  });
});
