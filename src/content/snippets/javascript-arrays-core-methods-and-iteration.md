---
title: 'JavaScript Arrays: Core Methods and Iteration'
published: 2026-01-15
draft: false
description: 'Learn the most useful ways to loop over arrays and the core methods you will reach for daily in JavaScript.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Once you understand what arrays are, the next step is learning how to **work with them effectively**. JavaScript gives you several looping patterns and a rich set of built‑in methods.

This snippet focuses on the **core iteration tools** you’ll use in almost every project.

## Classic `for` Loop

The traditional `for` loop gives you full control over the index and step size.

```javascript
const names = ['Ada', 'Grace', 'Linus'];

for (let i = 0; i < names.length; i++) {
  console.log(i, names[i]);
}
// 0 'Ada'
// 1 'Grace'
// 2 'Linus'
```

Use this when you need to:

- Skip elements conditionally.
- Iterate backwards.
- Work with indices explicitly.

## `for...of` for Values

`for...of` is a convenient way to loop over **values** in an array.

```javascript
const scores = [10, 20, 30];

for (const score of scores) {
  console.log(score);
}
// 10
// 20
// 30
```

Use `for...of` when you mostly care about **values** and not indices.

## `forEach` for Side Effects

The `forEach` method runs a callback for each element. It is common for side‑effectful operations like logging or updating the DOM.

```javascript
const users = ['Ada', 'Grace', 'Linus'];

users.forEach((user, index) => {
  console.log(`${index}: ${user}`);
});
// 0: Ada
// 1: Grace
// 2: Linus
```

Unlike some other array methods, `forEach`:

- **Always returns `undefined`** (it’s not for building new arrays).
- **Does not support `break` or `continue`**—if you need to early‑exit, use a `for` or `for...of` loop instead.

## `map` for Transforming Values

`map` builds a **new array** by applying a function to each element. It does not modify the original array.

```javascript
const prices = [10, 20, 30];

// Add 20% tax to each price
const pricesWithTax = prices.map((price) => price * 1.2);

console.log(pricesWithTax); // [12, 24, 36]
console.log(prices); // [10, 20, 30] (unchanged)
```

Use `map` when:

- You want to keep the same length.
- You are transforming values one‑to‑one.

## `filter` for Picking a Subset

`filter` builds a **new array** with only the elements where the callback returns `true`.

```javascript
const numbers = [1, 2, 3, 4, 5, 6];

// Keep only even numbers
const evens = numbers.filter((n) => n % 2 === 0);

console.log(evens); // [2, 4, 6]
console.log(numbers); // [1, 2, 3, 4, 5, 6] (unchanged)
```

Use `filter` when:

- You want to **remove** some elements based on a condition.
- The length of the result may be smaller than the original.

## `find` and `findIndex`

`find` returns the **first element** that matches a condition, or `undefined` if none match.

```javascript
const users = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Linus' },
];

const user = users.find((u) => u.id === 2);
console.log(user); // { id: 2, name: 'Grace' }
```

`findIndex` is similar but returns the **index** instead of the element.

```javascript
const index = users.findIndex((u) => u.name === 'Linus');
console.log(index); // 2
```

Use these when you expect **at most one important match** and want it directly.

## `some` and `every`

`some` checks whether **at least one** element matches a condition.

```javascript
const values = [1, 3, 5, 8];

const hasEven = values.some((n) => n % 2 === 0);
console.log(hasEven); // true
```

`every` checks whether **all** elements match a condition.

```javascript
const allPositive = values.every((n) => n > 0);
console.log(allPositive); // true
```

These methods are great for questions like “does this list contain any errors?” or “are all items valid?”.

## `includes`, `indexOf`, and `lastIndexOf`

When you need to know whether a **primitive value** is present in an array, use `includes`.

```javascript
const roles = ['admin', 'editor', 'viewer'];

console.log(roles.includes('editor')); // true
console.log(roles.includes('guest')); // false
```

If you also need the position, use `indexOf` (first occurrence) or `lastIndexOf` (last occurrence).

```javascript
const letters = ['a', 'b', 'c', 'a'];

console.log(letters.indexOf('a')); // 0
console.log(letters.lastIndexOf('a')); // 3
```

## `slice` vs `splice`

These two methods are easy to mix up:

- **`slice`**: returns a **copy** of a portion of the array (non‑mutating).
- **`splice`**: **changes** the original array by inserting or removing elements (mutating).

```javascript
const original = ['a', 'b', 'c', 'd'];

// slice: non‑mutating
const sub = original.slice(1, 3);
console.log(sub); // ['b', 'c']
console.log(original); // ['a', 'b', 'c', 'd']

// splice: mutating
const removed = original.splice(1, 2); // remove 2 elements starting at index 1
console.log(removed); // ['b', 'c']
console.log(original); // ['a', 'd']
```

In state‑heavy code (like React), you’ll typically prefer `slice` and other **non‑mutating** methods to keep arrays immutable.

## `join` for Building Strings

`join` turns an array into a single string, using a separator of your choice.

```javascript
const tags = ['javascript', 'arrays', 'snippets'];

const csv = tags.join(', ');
console.log(csv); // "javascript, arrays, snippets"

const slug = tags.join('-');
console.log(slug); // "javascript-arrays-snippets"
```

`join` is handy for building human‑readable labels, URLs, or CSV‑like outputs.

## Putting It Together

You’ll often chain several array methods together for more expressive code. For example, filtering and then mapping:

```javascript
const products = [
  { name: 'Keyboard', price: 120 },
  { name: 'Mouse', price: 40 },
  { name: 'Monitor', price: 300 },
];

// Get the names of products that cost at least 100
const premiumNames = products.filter((p) => p.price >= 100).map((p) => p.name);

console.log(premiumNames); // ['Keyboard', 'Monitor']
```

Mastering these core iteration patterns and methods will make your array‑heavy code both **shorter** and **easier to read**, and prepares you for more advanced patterns like `reduce` and working with nested arrays.
