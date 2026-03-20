---
title: 'JavaScript Objects: Best Practices and Pitfalls'
published: 2026-01-12
draft: false
description: 'Avoid common mistakes with JavaScript objects and apply practical patterns for safe, clean code.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Once you’re comfortable with objects, it’s important to understand some **practical tips** and **gotchas** that show up in real projects. These patterns can save you from subtle bugs and make your code easier to maintain.

## Safe Nested Access with Optional Chaining

Accessing nested properties can throw errors if any intermediate property is `null` or `undefined`. Optional chaining solves this.

```javascript
const user = {
  profile: { address: { city: 'London' } },
};

// Without optional chaining (can throw if profile or address is missing)
// console.log(user.profile.address.city);

// With optional chaining: returns undefined instead of throwing
console.log(user.profile?.address?.city); // "London"
console.log(user.profile?.address?.zip?.code); // undefined
```

## Providing Defaults with Nullish Coalescing

The nullish coalescing operator (`??`) gives you a default only when the left side is `null` or `undefined`, not for falsy values like `0` or `""`.

```javascript
const settings = {
  theme: 'dark',
  itemsPerPage: 0,
};

const theme = settings.theme ?? 'light'; // "dark"
const items = settings.itemsPerPage ?? 10; // 0 (kept, not replaced)
const unknown = settings.missing ?? 'fallback'; // "fallback"
```

Compare with `||`, which would treat `0` as falsy and replace it.

```javascript
const itemsOr = settings.itemsPerPage || 10;
console.log(itemsOr); // 10 (probably not what you want)
```

## Avoiding Shared References by Accident

When cloning templates, be careful with nested structures.

```javascript
const template = { tags: [] };

const a = { ...template };
const b = { ...template };

a.tags.push('x');

console.log(b.tags); // [] (separate arrays, good)
```

But if the template uses nested objects, shallow spread can still share references.

```javascript
const templateNested = { meta: { tags: [] } };

const a2 = { ...templateNested };
const b2 = { ...templateNested };

a2.meta.tags.push('x');

console.log(b2.meta.tags); // ['x'] (shared reference, surprising)
```

Use deep cloning (`structuredClone`) when you need fully independent copies.

```javascript
const a3 = structuredClone(templateNested);
const b3 = structuredClone(templateNested);

a3.meta.tags.push('y');

console.log(b3.meta.tags); // [] (now independent)
```

## Immutable Updates Instead of Mutation

In many state‑heavy apps (React, Redux, etc.), it’s safer to treat state as immutable and create new objects instead of mutating existing ones.

```javascript
// Mutation: modifies the original object
state.user.name = 'Ada';

// Immutable update: creates a new object with updated name
const newState = {
  ...state,
  user: {
    ...state.user,
    name: 'Ada',
  },
};
```

This makes it easier to track changes, undo/redo, and avoid unexpected side effects.

## Objects Compared by Reference, Not Value

Two objects with the same shape and values are **not** equal unless they are the same reference.

```javascript
const a = { x: 1 };
const b = { x: 1 };

console.log(a === b); // false (different objects)

const c = a;
console.log(a === c); // true  (same reference)
```

Use a deep equality helper (or a library like Lodash’s `isEqual`) when you need value equality.

## Don’t Use `for...in` on Arrays

`for...in` iterates over keys and includes inherited properties—bad for arrays.

```javascript
Array.prototype.extra = 123; // bad practice, but happens in some code

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

## Mutation via Shared References in Functions

When you pass an object to a function, the function receives a **reference** and can mutate the original object.

```javascript
function addTimestamp(obj) {
  // Mutates the original object
  obj.updatedAt = new Date();
}

const userObj = { name: 'Ada' };
addTimestamp(userObj);

console.log(userObj.updatedAt); // property was added by the function
```

If you want to avoid mutation and keep the function pure, return a new object instead.

```javascript
function withTimestamp(obj) {
  // Creates a shallow copy with an extra property
  return { ...obj, updatedAt: new Date() };
}

const user2 = { name: 'Ada' };
const updatedUser2 = withTimestamp(user2);

console.log(user2.updatedAt); // undefined (original unchanged)
console.log(updatedUser2.updatedAt instanceof Date); // true
```

By following these practices and watching out for the pitfalls, you’ll write object‑heavy JavaScript that’s easier to reason about, easier to debug, and more robust in production.
