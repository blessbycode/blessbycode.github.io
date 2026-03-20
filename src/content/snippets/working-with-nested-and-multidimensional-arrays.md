---
title: 'Working with Nested and Multidimensional Arrays in JavaScript'
published: 2026-01-15
draft: false
description: 'Handle nested and matrix-like arrays in JavaScript using readable iteration and transformation patterns.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Many real‑world problems naturally involve **nested arrays**:

- Grids in games or UI layouts.
- Tables of numbers for charts.
- Groups of groups (comments with replies, categories with subcategories).

In JavaScript, you represent these with arrays that contain other arrays.

## Basic Nested Arrays

The simplest nested array is a two‑dimensional structure—an array of rows, where each row is an array of cells.

```javascript
const grid = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

console.log(grid[0][0]); // 1
console.log(grid[1][2]); // 6
console.log(grid[2][1]); // 8
```

You can imagine `grid[row][column]`, with both indices starting at `0`.

## Iterating over 2D Arrays

The most direct way to process every element in a 2D array is a **nested loop**.

```javascript
const grid = [
  [1, 2, 3],
  [4, 5, 6],
];

for (let row = 0; row < grid.length; row++) {
  for (let col = 0; col < grid[row].length; col++) {
    const value = grid[row][col];
    console.log(`Row ${row}, Col ${col} = ${value}`);
  }
}
```

You can also use `for...of` for a more readable style:

```javascript
for (const row of grid) {
  for (const value of row) {
    console.log(value);
  }
}
```

This is often enough for many matrix‑like operations.

## Transforming Nested Arrays

You can combine `map` and nested `map` calls to transform 2D structures without mutating them.

```javascript
const grid = [
  [1, 2],
  [3, 4],
];

// Double every value without changing the original grid
const doubled = grid.map((row) => row.map((value) => value * 2));

console.log(doubled);
// [
//   [2, 4],
//   [6, 8],
// ]
console.log(grid);
// [
//   [1, 2],
//   [3, 4],
// ]
```

This pattern scales to more complex transformations—just keep your callbacks small and focused.

## Flattening Nested Arrays

Sometimes you want to turn a nested array into a **single flat array**. Modern JavaScript gives you `flat` and `flatMap` for this.

```javascript
const nested = [1, [2, 3], [4, [5]]];

console.log(nested.flat()); // [1, 2, 3, 4, [5]]
console.log(nested.flat(2)); // [1, 2, 3, 4, 5]
```

- The argument to `flat` is the **depth** to flatten.
- `flat(Infinity)` flattens all levels (use carefully on large or unknown structures).

`flatMap` combines `map` and `flat(1)` in a single method.

```javascript
const sentences = ['hello world', 'arrays in javascript'];

// Turn into an array of words
const words = sentences.flatMap((sentence) => sentence.split(' '));

console.log(words); // ['hello', 'world', 'arrays', 'in', 'javascript']
```

Without `flatMap`, you’d need `map` followed by `flat(1)`.

## Representing Grids Safely

For grid‑like data, it’s common to use a **fixed row length** and treat missing cells carefully.

```javascript
function createGrid(rows, cols, initialValue = null) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => initialValue),
  );
}

const board = createGrid(3, 3, 0);

console.log(board);
// [
//   [0, 0, 0],
//   [0, 0, 0],
//   [0, 0, 0],
// ]
```

Using `Array.from` ensures each row is its **own array**. Avoid patterns that accidentally share the same inner array:

```javascript
// Be careful: this reuses the same inner array reference
const wrong = Array(3).fill(Array(3).fill(0));

wrong[0][0] = 1;
console.log(wrong);
// [
//   [1, 0, 0],
//   [1, 0, 0], // changed too!
//   [1, 0, 0], // changed too!
// ]
```

All rows share the same inner array, so mutating one row mutates them all.

## Nested Arrays for Hierarchical Data

Nested arrays aren’t just for grids—they can represent **hierarchies** like comments and replies.

```javascript
const comments = [
  {
    id: 1,
    text: 'Great post!',
    replies: [
      { id: 2, text: 'Thank you!' },
      { id: 3, text: 'Glad you liked it.' },
    ],
  },
  {
    id: 4,
    text: 'Nice explanation of arrays.',
    replies: [],
  },
];
```

Here `replies` is an array nested inside each comment object. You can traverse this structure with nested loops or recursive functions:

```javascript
function printComments(list, indent = 0) {
  for (const comment of list) {
    console.log(' '.repeat(indent) + '- ' + comment.text);
    if (comment.replies && comment.replies.length > 0) {
      printComments(comment.replies, indent + 2);
    }
  }
}

printComments(comments);
```

## Summary

- Nested arrays let you model 2D grids and hierarchical data naturally.
- Use nested loops or nested `map` calls to iterate and transform 2D arrays.
- `flat` and `flatMap` make it easy to flatten or partially flatten nested structures.
- When building grids, ensure each row is a **separate array** to avoid unexpected shared mutations.

With these patterns, you can handle everything from game boards to table data and threaded comments while keeping the code readable and predictable.
