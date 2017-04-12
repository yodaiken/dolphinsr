// @flow

import type { CardState, ReviewingCardState, Schedule, CardsSchedule, State, CardId } from './types';
import { getCardId } from './types';
import dateDiffInDays from './dateDiffInDays';

// assumes that the day starts at 3:00am in the local timezone
export function calculateDueDate(state: ReviewingCardState): Date {
  const result = new Date(state.lastReviewed);
  result.setHours(3, 0, 0);
  result.setDate(result.getDate() + Math.ceil(state.interval));
  return result;
}

export function computeScheduleFromCardState(state: CardState, now: Date): Schedule {
  if (state.mode === 'lapsed' || state.mode === 'learning') {
    return 'learning';
  } else if (state.mode === 'reviewing') {
    const diff = dateDiffInDays(calculateDueDate(state), now);
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
export function pickMostDue(s: CardsSchedule, state: State): ?CardId {
  const prec: Schedule[] = ['learning', 'overdue', 'due'];
  for (let i = 0; i < prec.length; i += 1) {
    const sched = prec[i];
    if (s[sched].length) {
      return s[sched].slice(0).sort((a, b) => {
        const cardA = state.cardStates[a];
        const cardB = state.cardStates[b];
        if (cardA == null) {
          throw new Error(`id not found in state: ${a}`);
        }
        if (cardB == null) {
          throw new Error(`id not found in state: ${b}`);
        }

        const reviewDiff = (
          (cardA.lastReviewed == null && cardB.lastReviewed != null) ? 1 :
          (cardB.lastReviewed == null && cardA.lastReviewed != null) ? -1 :
          (cardA.lastReviewed == null && cardB.lastReviewed == null) ? 0 :
          (cardB.lastReviewed: any) - (cardA.lastReviewed: any)
        );
        if (reviewDiff !== 0) {
          return -reviewDiff;
        }

        if (a === b) {
          throw new Error(`comparing duplicate id: ${a}`);
        }
        return b > a ? 1 : -1;
      })[0];
    }
  }
  return null;
}

export default function computeCardsSchedule(state: State, now: Date): CardsSchedule {
  const s: CardsSchedule = {
    learning: [],
    later: [],
    due: [],
    overdue: [],
  };
  Object.keys(state.cardStates).forEach((cardId) => {
    const cardState = state.cardStates[cardId];
    s[computeScheduleFromCardState(cardState, now)].push(getCardId(cardState));
  });
  return s;
}
