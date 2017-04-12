import { generateId, getCardId, cmpSchedule } from '../lib/types';

describe('generateId()', () => {
  it('should return a valid UUID', () => {
    expect(generateId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
  it('should return different UUIDs when called twice', () => {
    expect(generateId()).not.toEqual(generateId());
  });
});

describe('getCardId()', () => {
  it('should return a valid "card ID" string', () => {
    const id = generateId();
    const combination = { front: [0, 1, 2], back: [3] };
    expect(getCardId({ master: id, combination })).toEqual(`${id}#0,1,2@3`);
  });
});

describe('cmpSchedule()', () => {
  it("cmpSchedule('later', 'later') should return 0", () => {
    expect(cmpSchedule('later', 'later')).toEqual(0);
  });
  it("cmpSchedule('later', 'due') should return 1", () => {
    expect(cmpSchedule('later', 'due')).toEqual(1);
  });
  it("cmpSchedule('later', 'overdue') should return 1", () => {
    expect(cmpSchedule('later', 'overdue')).toEqual(1);
  });
  it("cmpSchedule('learning', 'later') should return -1", () => {
    expect(cmpSchedule('learning', 'later')).toEqual(-1);
  });
});
