// @flow


import type { Master } from '../lib';
import * as dates from './dates';

const { DolphinSR, generateId } = (
  process.env.TEST_DIST ? require('../dist/bundle') : require('../lib')
);

describe('Dolphin instance', () => {
  it('should start out empty', () => {
    const d = new DolphinSR();
    expect(d.nextCard()).toBeNull();
    expect(d.summary()).toEqual({ due: 0, later: 0, learning: 0, overdue: 0 });
  });
  it('should add a new masters to the "learning"', () => {
    const d = new DolphinSR();
    const master: Master = {
      id: generateId(),
      combinations: [{ front: [0], back: [1, 0] }],
      fields: ['hello', 'world'],
    };
    d.addMasters(master);
    expect(d.nextCard()).toEqual({
      master: master.id,
      combination: master.combinations[0],
      front: ['hello'],
      back: ['world', 'hello'],
    });
    expect(d.summary()).toEqual({ due: 0, later: 0, learning: 1, overdue: 0 });
  });
  it('should add multiple new masters to the "learning" category', () => {
    const d = new DolphinSR();
    d.addMasters({
      id: generateId(),
      combinations: [{ front: [0], back: [1, 0] }],
      fields: ['hello', 'world'],
    }, {
      id: generateId(),
      combinations: [{ front: [0], back: [1, 0] }],
      fields: ['hello', 'world'],
    });
    expect(d.summary()).toEqual({ due: 0, later: 0, learning: 2, overdue: 0 });
    d.addMasters({
      id: generateId(),
      combinations: [{ front: [0], back: [1, 0] }],
      fields: ['hello', 'world'],
    });
    expect(d.summary()).toEqual({ due: 0, later: 0, learning: 3, overdue: 0 });
  });
  it('should add reviews', () => {
    const d = new DolphinSR(() => dates.today);
    const master: Master = {
      id: generateId(),
      combinations: [{ front: [0], back: [1, 0] }],
      fields: ['hello', 'world'],
    };
    d.addMasters(master);
    expect(d.nextCard()).toEqual({
      master: master.id,
      combination: master.combinations[0],
      front: ['hello'],
      back: ['world', 'hello'],
    });
    expect(d.summary()).toEqual({ due: 0, later: 0, learning: 1, overdue: 0 });

    expect(d.addReviews({
      master: master.id,
      combination: master.combinations[0],
      ts: dates.today,
      rating: 'easy',
    })).toEqual(false);
    expect(d.summary()).toEqual({ due: 0, later: 1, learning: 0, overdue: 0 });
    expect(d.nextCard()).toBeNull();

    const secondMaster: Master = {
      id: generateId(),
      combinations: [{ front: [0], back: [1, 0] }],
      fields: ['hello', 'world'],
    };
    d.addMasters(secondMaster);
    expect(d.summary()).toEqual({ due: 0, later: 1, learning: 1, overdue: 0 });
    expect(d.addReviews({
      master: secondMaster.id,
      combination: master.combinations[0],
      ts: dates.today,
      rating: 'easy',
    })).toEqual(false);
    expect(d.summary()).toEqual({ due: 0, later: 2, learning: 0, overdue: 0 });
    expect(d.nextCard()).toBeNull();
  });

  it('should rebuild the cache when reviews are added out of order', () => {
    const d = new DolphinSR(() => dates.today);
    const master: Master = {
      id: generateId(),
      combinations: [{ front: [0], back: [1, 0] }],
      fields: ['hello', 'world'],
    };
    d.addMasters(master);
    expect(d.nextCard()).toEqual({
      master: master.id,
      combination: master.combinations[0],
      front: ['hello'],
      back: ['world', 'hello'],
    });
    expect(d.summary()).toEqual({ due: 0, later: 0, learning: 1, overdue: 0 });

    expect(d.addReviews({
      master: master.id,
      combination: master.combinations[0],
      ts: dates.laterTmrw,
      rating: 'easy',
    })).toEqual(false);
    d._currentDateGetter = () => dates.laterTmrw;

    expect(d.addReviews({
      master: master.id,
      combination: master.combinations[0],
      ts: dates.today,
      rating: 'easy',
    })).toEqual(true);

    expect(d.summary()).toEqual({ due: 0, later: 1, learning: 0, overdue: 0 });
  });
});
