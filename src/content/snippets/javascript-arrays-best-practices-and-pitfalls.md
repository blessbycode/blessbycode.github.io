---
title: 'JavaScript Arrays: Best Practices and Pitfalls'
published: 2026-01-15
draft: false
description: 'Avoid common mistakes with JavaScript arrays and apply practical patterns for clean, predictable code.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Arrays are everywhere in JavaScript. Once you’re comfortable with the basics, it’s worth learning some **best practices** and **gotchas** that show up in real codebases.

## Prefer Non‑Mutating Methods for Shared State

Many array methods **mutate** the original array:

- `push`, `pop`
- `shift`, `unshift`
- `splice`, `sort`, `reverse`

In state‑heavy code (React, Redux, or anywhere multiple parts of your app share the same data), mutating arrays in place can cause subtle bugs.

Prefer **non‑mutating** patterns when working with shared state:

```javascript
// Bad in shared state: mutates the original array
state.items.push(newItem);

// Better: create a new array
const newState = {
  ...state,
  items: [...state.items, newItem],
};
```

Similarly, instead of `splice` to remove an item:

```javascript
// Remove item by id without mutation
const filtered = state.items.filter((item) => item.id !== idToRemove);
```

Mutation is fine for small, local variables—but be extra cautious around shared or long‑lived arrays.

## Don’t Use `for...in` on Arrays

`for...in` iterates over **keys** (and includes inherited properties), making it a poor fit for arrays.

```javascript
Array.prototype.extra = 123; // bad practice, but it happens

const arr = [10, 20, 30];

for (const key in arr) {
  console.log(key);
}
// '0'
// '1'
// '2'
// 'extra'  (unexpected)
```

Use `for...of` or array methods instead:

```javascript
for (const value of arr) {
  console.log(value);
}
// 10
// 20
// 30
```

## Beware Sparse Arrays and `Array(length)`

Using `new Array(length)` creates an array with **empty slots**, not actual `undefined` values. Some methods behave unexpectedly with these “holes”.

```javascript
const a = new Array(3);

console.log(a.length); // 3
console.log(a[0]); // undefined, but the slot is "empty"

// map skips empty slots
const doubled = a.map(() => 2);
console.log(doubled); // [ <3 empty items> ]
```

Prefer explicit filling:

```javascript
// Create an array of 3 zeros
const zeros = Array(3).fill(0);
console.log(zeros); // [0, 0, 0]
```

If you see arrays with `<empty>` items in logs, you’re likely dealing with a sparse array.

## Using `length` Intentionally

The `length` property is writable. Setting it lower **truncates** the array.

```javascript
const values = [1, 2, 3, 4, 5];

values.length = 3;
console.log(values); // [1, 2, 3]
```

This can be a deliberate way to clear or truncate arrays:

```javascript
// Clear an array in place
values.length = 0;
console.log(values); // []
```

But accidentally assigning to `length` can lose data, so avoid writing to it unless you really mean to.

## Sorting Pitfalls

`Array.prototype.sort`:

- **Mutates** the array in place.
- Converts elements to strings by default and sorts **lexicographically**, which can be surprising for numbers.

```javascript
const numbers = [2, 10, 1];

numbers.sort();
console.log(numbers); // [1, 10, 2] (string comparison)
```

Always pass a compare function for numbers and objects:

```javascript
const sorted = [...numbers].sort((a, b) => a - b);
console.log(sorted); // [1, 2, 10]
console.log(numbers); // [2, 10, 1] (unchanged because we copied first)
```

Copying with `[...]` (or `slice()`) before sorting is a good habit when you want to avoid mutating the original array.

## Equality: Arrays Compared by Reference, Not Value

Two arrays with the same contents are **not** equal unless they’re the same reference.

```javascript
const a = [1, 2, 3];
const b = [1, 2, 3];

console.log(a === b); // false

const c = a;
console.log(a === c); // true
```

To compare arrays by value, you’ll need to:

- Check length and each element yourself, or
- Use a helper function / testing library that supports deep equality.

## Returning New Arrays from Functions

When writing helpers that work with arrays, it’s usually safer to **return new arrays** instead of mutating the input. This makes functions easier to reason about and reuse.

```javascript
// Mutating version
function addTagInPlace(tags, tag) {
  tags.push(tag);
}

// Immutable version
function withTag(tags, tag) {
  return [...tags, tag];
}

const original = ['js'];
const updated = withTag(original, 'arrays');

console.log(original); // ['js']
console.log(updated); // ['js', 'arrays']
```

## Handling Empty Arrays Correctly

Many array methods behave differently on empty arrays, so it’s good to know the details:

- `map` and `filter` on an empty array simply return a new empty array.
- `reduce` **throws an error** if you don’t provide an initial value.

```javascript
const empty = [];

// Safe: returns []
const doubled = empty.map((x) => x * 2);

// Unsafe: TypeError: reduce of empty array with no initial value
// const total = empty.reduce((sum, x) => sum + x);

// Safe: always provide an initial value when array might be empty
const totalSafe = empty.reduce((sum, x) => sum + x, 0);
console.log(totalSafe); // 0
```

Whenever an array might be empty, prefer **supplying an initial value** to `reduce`.

## Copying and Cloning Arrays

Shallow copies are easy with:

- Spread: `[...array]`
- `slice()`: `array.slice()`
- `Array.from(arrayLike)`

```javascript
const original = [1, 2, 3];

const copy1 = [...original];
const copy2 = original.slice();

copy1.push(4);

console.log(original); // [1, 2, 3]
console.log(copy1); // [1, 2, 3, 4]
```

Remember: these are **shallow** copies. If the array contains objects, the objects are shared.

```javascript
const users = [{ name: 'Ada' }, { name: 'Grace' }];
const copy = [...users];

copy[0].name = 'Changed';

console.log(users[0].name); // 'Changed' (same object reference)
```

For deep cloning nested arrays/objects, consider `structuredClone` or a dedicated library.

## Summary

- Prefer non‑mutating patterns (`map`, `filter`, `slice`, spreading) for shared or long‑lived state.
- Avoid `for...in` on arrays; use `for...of` or array methods.
- Watch out for sparse arrays and unintended `length` changes.
- Always provide a comparator to `sort` when working with numbers or objects.
- Treat arrays as reference values and be explicit about when you’re mutating vs returning new arrays.

With these practices, your array‑heavy code will be more predictable, easier to test, and friendlier to work with in larger applications.
