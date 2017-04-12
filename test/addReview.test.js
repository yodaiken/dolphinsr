// @flow

import addReview from '../lib/addReview';
import * as dates from './dates';
import type { Review } from '../lib/types';
import { generateId } from '../lib/types';


const master = generateId();
function makeReview(ts: Date): Review {
  return {
    master,
    ts,
    combination: { front: [0], back: [1] },
    rating: 'easy',
  };
}

const reviews = [
  dates.today,
  dates.todayAt3AM,
  dates.laterToday,
  dates.laterTmrw,
  dates.laterInTwoDays,
  dates.laterInFourDays,
].map(makeReview);

describe('addReview()', () => {
  it('should add a review to an empty list', () => {
    expect(addReview([], reviews[0]))
    .toEqual([reviews[0]]);
  });
  it('should add a later review after a earlier review', () => {
    expect(addReview([reviews[0]], reviews[1]))
    .toEqual([reviews[0], reviews[1]]);
  });
  it('should add an earlier review before a later review', () => {
    expect(addReview([reviews[1]], reviews[0]))
    .toEqual([reviews[0], reviews[1]]);
  });
  it('should add an earlier review before a couple later reviews', () => {
    expect(addReview(reviews.slice(1), reviews[0]))
    .toEqual(reviews);
  });
  it('should add a review in between reviews', () => {
    expect(addReview([reviews[0], reviews[1], reviews[2], reviews[4], reviews[5]], reviews[3]))
    .toEqual(reviews);
  });
  it('should add an unidentical review with a same timestamp after', () => {
    const r: Review = makeReview(dates.today);
    const s: Review = makeReview(dates.today);
    s.rating = 'again';

    expect(addReview([r], s))
    .toEqual([r, s]);
    expect(addReview([s], r))
    .toEqual([s, r]);

    expect(addReview([r, ...reviews], s))
    .toEqual([r, reviews[0], s, ...reviews.slice(1)]);
  });
});
