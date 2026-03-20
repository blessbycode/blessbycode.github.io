---
title: 'JavaScript Arrays: What They Are'
published: 2026-01-15
draft: false
description: 'Understand what arrays are in JavaScript and how to use them to work with ordered lists of data.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

JavaScript works with ordered collections of values all the time—lists of users, search results, DOM nodes, points on a chart, log entries, and more. The primary way to represent these ordered lists is with an **array**.

At its core, an array is an **ordered list of values**, indexed starting at `0`.

```javascript
// A simple array of numbers
const scores = [10, 20, 30];

console.log(scores[0]); // 10
console.log(scores[1]); // 20
console.log(scores[2]); // 30
console.log(scores.length); // 3
```

Arrays can hold **any type of value**, including objects, other arrays, or a mix of types.

```javascript
const mixed = [
  'Ada Lovelace',
  36,
  true,
  ['mathematics', 'programming'],
  { city: 'London', country: 'UK' },
];

console.log(mixed[0]); // "Ada Lovelace"
console.log(mixed[3][0]); // "mathematics"
console.log(mixed[4].city); // "London"
```

## Creating Arrays

The most common way to create an array is with **array literals** (`[]`).

```javascript
const empty = [];
const primes = [2, 3, 5, 7, 11];
```

You can also use the `Array` constructor, but it behaves differently depending on how you call it and is usually avoided for simple lists.

```javascript
// Creates an empty array of length 3 (with empty slots)
const threeEmptySlots = new Array(3);
console.log(threeEmptySlots.length); // 3

// Creates an array with the single element 3
const singleElement = new Array(3, 4, 5);
console.log(singleElement); // [3, 4, 5]
```

In modern code, **prefer literals** (`[]`) unless you specifically need the constructor behaviour.

## Arrays vs. Objects

Both arrays and objects are technically objects under the hood, but they are used for different purposes:

- **Arrays**: ordered collections indexed by number (`0`, `1`, `2`, …).
- **Objects**: collections of key–value pairs keyed by string or symbol.

```javascript
// Array: order matters
const todoList = ['Write blog post', 'Review PR', 'Go for a walk'];

// Object: keys describe properties
const todoItem = {
  title: 'Write blog post',
  done: false,
};

console.log(todoList[0]); // "Write blog post"
console.log(todoItem.title); // "Write blog post"
```

When you care about **position**, use an array. When you care about **named properties**, use an object.

## Growing and Shrinking Arrays

Arrays are **dynamic**—you can add or remove elements at any time.

```javascript
const tasks = ['draft article'];

// Add to the end
tasks.push('edit article');
tasks.push('publish article');

console.log(tasks); // ['draft article', 'edit article', 'publish article']

// Remove from the end
const last = tasks.pop();
console.log(last); // 'publish article'
console.log(tasks); // ['draft article', 'edit article']

// Add to the beginning
tasks.unshift('brainstorm ideas');
console.log(tasks); // ['brainstorm ideas', 'draft article', 'edit article']

// Remove from the beginning
const first = tasks.shift();
console.log(first); // 'brainstorm ideas'
console.log(tasks); // ['draft article', 'edit article']
```

You can also insert or remove elements at arbitrary positions using `splice`.

```javascript
const colors = ['red', 'green', 'blue'];

// Insert 'yellow' at index 1 (between red and green)
colors.splice(1, 0, 'yellow');
console.log(colors); // ['red', 'yellow', 'green', 'blue']

// Remove 2 elements starting at index 1
const removed = colors.splice(1, 2);
console.log(removed); // ['yellow', 'green']
console.log(colors); // ['red', 'blue']
```

## Iterating Over Arrays

You’ll often want to **loop over every element** in an array. Modern JavaScript gives you several convenient ways to do this.

```javascript
const names = ['Ada', 'Grace', 'Linus'];

// Classic for loop
for (let i = 0; i < names.length; i++) {
  console.log(i, names[i]);
}

// for...of loop: cleaner for values
for (const name of names) {
  console.log(name);
}

// forEach method
names.forEach((name, index) => {
  console.log(index, name);
});
```

Each style has its place, but `for...of` and `forEach` are a good starting point for most everyday tasks.

## Arrays as Return Values and Inputs

Functions frequently **return arrays** of results or accept arrays as inputs. This makes it easy to compose data transformations.

```javascript
function getEvenNumbers(numbers) {
  const evens = [];

  for (const n of numbers) {
    if (n % 2 === 0) {
      evens.push(n);
    }
  }

  return evens;
}

const values = [1, 2, 3, 4, 5, 6];
const evens = getEvenNumbers(values);

console.log(evens); // [2, 4, 6]
```

Once you’re comfortable with what arrays are—ordered, index‑based, dynamic collections—you’re ready to explore powerful **array methods** like `map`, `filter`, and `reduce` to transform and analyse lists of data in a more declarative style.
