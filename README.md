# DolphinSR: Spaced Repetition in JavaScript

DolphinSR implements [spaced repetition](https://en.wikipedia.org/wiki/Spaced_repetition) in
JavaScript. Specifically, it uses [Anki's modifications](https://apps.ankiweb.net/docs/manual.html#what-algorithm),
to the SM2 algorithm including:

- an initial mode for learning new cards
- a mode for re-learning cards after forgetting them
- reducing the number of self-assigned ratings from 6 to 4
- factoring lateness into card scheduling
- Anki's default configuration options

While DolphinSR is intentionally very similar to Anki's algorithm, it does deviate in a few ways:

- improved support for adding reviews out of order (for example, due to network latency)
- very different internal data structures (DolphinSR is largely written in a functional style to
  make testing and debugging easier, and does not rely on storing computed data or any SQL database)
- only one kind of card

## Installation

DolphinSR is an `npm` package. Install it with either `yarn add dolphinsr` or
`npm install --save dolphinsr`.

**It's strongly recommended that you use Flow to statically check your code when using DolphinSR.**
We rely on it exclusively for type-checking, and don't do any runtime validation of type arguments.
For more information, [visit the Flow webpage](https://flow.org);

## Quick Start

```{js}

import { DolphinSR, generateId } from 'dolphinsr';
import type { Master, Review } from 'dolphinsr';

// Specify the combinations DolphinSR should make out of your master cards.
// Numbers refer to indexes on the card. (Don't worry and keep reading if you don't understand)
const chineseCombinations = [
  {front: [0], back: [1, 2]},
  {front: [1], back: [0, 2]},
  {front: [2], back: [0, 3]}
];
const frenchCombinations = [
  {front: [0], back: [1]},
  {front: [1], back: [0]}
];

// Create the master cards that DolphinSR will use spaced repetition to teach.
// Note: in a real program, you'd want to persist these somewhere (a database, localStorage, etc)
const vocab: Array<Master> = [
  {
    id: generateId(),
    combinations: chineseCombinations,
    fields: ['你好', 'nǐ hǎo', 'hello']
  },
  {
    id: generateId(),
    combinations: chineseCombinations,
    fields: ['世界', 'shìjiè', 'world']
  },
  {
    id: generateId(),
    combinations: frenchCombinations,
    fields: ['le monde', 'the world']
  },
  {
    id: generateId(),
    combinations: frenchCombinations,
    fields: ['bonjour', 'hello (good day)']
  }
];

// Create the datastore used to house reviews.
// Again, in a real app you'd want to persist this somewhere.
const reviews: Array<Review> = [];

// Create a new DolphinSR instance
const d = new DolphinSR();

// Add all of your vocab to the DolphinSR instance
d.addMasters(...vocab);

// Add any existing reviews to the DolphinSR instance
// (In this example, this doesn't do anything since reviews is empty.)
d.addReviews(...reviews);

// Now, DolphinSR can tell us what card to review next.
// Since generateId() generates a random ID, it could be any of the cards we added.
// For example, it could be:
//     {
//       master: <Id>,
//       combination: {front: [0], back: [1, 2]},
//       front: ['你好'],
//       back: ['nǐ hǎo', 'hello']
//     }
const card = d.nextCard();

// It will also give us statistics on the cards we have:
// Since we added 2 masters with 3 combinations (the Chinese vocab) and 2 masters with 2
// combinations (the French vocab), we will have 10 cards. Since we haven't reviewed any of them
// yet, they will all be in a "learning" state.
const stats = d.summary(); // => { due: 0, later: 0, learning: 10, overdue: 0 }

// Now, we can review the current card (probably triggered by a real app's UI)
// If we already knew the answer, we would create a review saying that it was "easy" to recall:
const review: Review = {
  // identify which card we're reviewing
  master: d.nextCard().master,
  combination: d.nextCard().combination,

  // store when we reviewed it
  ts: new Date(),

  // store how easy it was to remember
  rating: 'easy'
};
reviews.push(review); // in a real app, we'd store this persistently
d.addReviews(review);

// Since we reviewed the current card, and marked it easy to remember, DolphinSR will move it into
// 'review' mode, which resembles classic SM2 spaced repetition. So everything else will still be in
// 'learn' mode, and it will be scheduled to be reviewed later.
d.summary(); // => { due: 0, later: 1, learning: 9, overdue: 0 }

// This will show the next card to review.
d.nextCard();
```

## API

### generateId(): Id
This generates a new ID for a master card. It uses the `uuid` package under the hood. Always use
`generateId()` to generate IDs for your masters.

### new DolphinSR()
Create a new DolphinSR instance, `d`.

### (new DolphinSR()).addMasters(...masters: Master[]): void
Add masters to the DolphinSR instance. Masters with duplicate IDs will cause a runtime exception.

### (new DolphinSR()).addReviews(...reviews: Review[]): boolean
Add reviews to the DolphinSR instance.

`addReviews()` is significantly more efficient if `reviews` are sorted in ascending order by `ts`,
and all chronologically come after the previous latest review for any card. If this condition is
met, `addReviews()` will return `false`. Otherwise, it returns `true`.

## Types

### Master

A `Master` is an object conforming to the following Flow signature:

```{js}
{
  id: Id, // from generateId()
  fields: Array<Field>, // see Field
  combinations: Array<Combination>, // see Combination
}
```

### Field

A `Field` is a unit of data in a master. It is type alias for `string`.

### Combination

A `Combination` is an object representing how `Fields` in a master should be combined to fit on a
card with a front and a back. It looks like this:

```{js}
{front: number[], back: number[]}
```

### Rating

A `Rating` is an enum describing how well a user knows a specific combination of a master card. It
can be (in descending order of ease):

- `'easy'`
- `'good'`
- `'hard'`
- `'again'`

### Review

A `Review` is an object describing a review of a card by a user. It should look like this:

```{js}
{
  master: Id,
  combination: Combination,
  ts: Date,
  rating: Rating,
}
```
