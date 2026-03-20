---
title: 'Transforming JavaScript Arrays with map, filter, and reduce'
published: 2026-01-15
draft: false
description: 'Use map, filter, and reduce to transform and summarise array data in a clear, declarative style.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Arrays really shine when you start **transforming** them—turning raw data into exactly the shape you need for rendering, reporting, or further processing.

Three methods show up everywhere in modern JavaScript:

- **`map`**: transform each element into a new value.
- **`filter`**: keep only the elements that match a condition.
- **`reduce`**: combine all elements into a single value (number, object, array, etc.).

## `map`: One‑to‑One Transformations

`map` creates a **new array** with the results of calling a function on every element.

```javascript
const numbers = [1, 2, 3, 4];

// Square each number
const squares = numbers.map((n) => n * n);

console.log(squares); // [1, 4, 9, 16]
console.log(numbers); // [1, 2, 3, 4] (unchanged)
```

You can use `map` to:

- Format data for display (add units, format dates).
- Extract a single property from objects.
- Build derived fields.

```javascript
const users = [
  { id: 1, firstName: 'Ada', lastName: 'Lovelace' },
  { id: 2, firstName: 'Grace', lastName: 'Hopper' },
];

// Full names for display
const fullNames = users.map((user) => `${user.firstName} ${user.lastName}`);

console.log(fullNames); // ['Ada Lovelace', 'Grace Hopper']
```

## `filter`: Picking a Subset

`filter` creates a new array with **only the elements** that pass a test.

```javascript
const values = [10, -5, 0, 42, -1];

// Keep only non‑negative numbers
const nonNegative = values.filter((n) => n >= 0);

console.log(nonNegative); // [10, 0, 42]
console.log(values); // [10, -5, 0, 42, -1] (unchanged)
```

Use `filter` to:

- Remove invalid items (missing required fields).
- Apply search queries or category filters.
- Drop outliers from data sets.

```javascript
const products = [
  { name: 'Keyboard', inStock: true },
  { name: 'Mouse', inStock: false },
  { name: 'Monitor', inStock: true },
];

const available = products.filter((p) => p.inStock);

console.log(available);
// [
//   { name: 'Keyboard', inStock: true },
//   { name: 'Monitor', inStock: true },
// ]
```

## Chaining `map` and `filter`

`map` and `filter` are often **chained** together to express a series of transformations.

```javascript
const orders = [
  { id: 1, total: 120, status: 'complete' },
  { id: 2, total: 80, status: 'pending' },
  { id: 3, total: 200, status: 'complete' },
];

// Get the totals of completed orders only
const completedTotals = orders
  .filter((order) => order.status === 'complete')
  .map((order) => order.total);

console.log(completedTotals); // [120, 200]
```

This “filter then map” pattern is a staple in data‑heavy JavaScript code.

## `reduce`: From Many Values to One

While `map` and `filter` keep arrays as arrays, `reduce` is about collapsing an array into a **single result**.

The general pattern looks like this:

```javascript
const result = array.reduce((accumulator, current, index, array) => {
  // return the next accumulator value
}, initialAccumulatorValue);
```

### Summing Numbers

```javascript
const numbers = [10, 20, 30];

const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log(sum); // 60
```

- `acc` starts at `0` (the initial value).
- For each element, you return the new accumulated total.

### Building an Object

`reduce` can also build **objects** from arrays.

```javascript
const users = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Linus' },
];

// Turn into a lookup table by id
const byId = users.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});

console.log(byId[2]); // { id: 2, name: 'Grace' }
```

### Grouping Items

Another classic use of `reduce` is grouping items by a key.

```javascript
const transactions = [
  { type: 'income', amount: 100 },
  { type: 'expense', amount: 40 },
  { type: 'income', amount: 60 },
];

const grouped = transactions.reduce(
  (acc, tx) => {
    acc[tx.type].push(tx);
    return acc;
  },
  { income: [], expense: [] },
);

console.log(grouped.income);
// [ { type: 'income', amount: 100 }, { type: 'income', amount: 60 } ]
```

### Combining `filter`, `map`, and `reduce`

You can often express fairly complex operations by chaining these three.

```javascript
const orders = [
  { id: 1, total: 120, status: 'complete' },
  { id: 2, total: 80, status: 'pending' },
  { id: 3, total: 200, status: 'complete' },
];

// Total revenue from completed orders
const completedRevenue = orders
  .filter((order) => order.status === 'complete') // keep completed
  .map((order) => order.total) // take just the totals
  .reduce((sum, total) => sum + total, 0); // sum them

console.log(completedRevenue); // 320
```

This style tends to be:

- **Declarative**: you describe _what_ happens, step by step.
- **Composable**: each method does one thing, and they combine cleanly.

## When Not to Use `reduce`

`reduce` is powerful, but also easy to overuse. Consider clarity:

- If you just need to sum numbers, a small helper like `sum(numbers)` that uses `reduce` internally can be clearer for callers.
- If you’re doing many different things inside a single `reduce` callback, it might be time to break the logic into smaller functions or use intermediate variables.

As a rule of thumb:

- Use **`map`** when each input value becomes exactly one output value.
- Use **`filter`** when you need a subset of the array.
- Reach for **`reduce`** when the result is not an array—like a number, object, or a differently shaped array.

Once these three methods feel natural, you’ll find yourself writing far fewer manual loops and far more readable data‑transformation code.
