---
title: 'JavaScript Symbols and Advanced Object Features'
published: 2026-01-12
draft: false
description: 'Use symbols, custom toString tags, and iterators to extend how JavaScript objects behave.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

JavaScript objects can participate in special language features through **symbols** like `Symbol.iterator` and `Symbol.toStringTag`. These are powerful for building libraries, data structures, and abstractions that feel like native language features.

## Symbols as Hidden Keys

`Symbol` creates unique values that can be used as property keys without the risk of collisions.

```javascript
const id = Symbol('id');

const user = {
  name: 'Ada',
  [id]: 123, // symbol-keyed property
};

console.log(user[id]); // 123
console.log(Object.keys(user)); // ['name']  (symbol key is not listed)
```

Symbol keys are not part of normal enumeration with `for...in` or `Object.keys`, but you can access them explicitly:

```javascript
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id)]
```

This makes symbols great for **internal state** or metadata you don’t want to expose accidentally.

## Customizing `Object.prototype.toString` with `Symbol.toStringTag`

`Object.prototype.toString.call(value)` normally returns strings like `"[object Object]"` or `"[object Array]"`. You can customize this for your own objects.

```javascript
const collection = {
  [Symbol.toStringTag]: 'MyCollection',
  items: [],
};

console.log(Object.prototype.toString.call(collection));
// "[object MyCollection]"
```

This is mostly useful in library code or debugging tools when you want nicer type labels.

## Making Objects Iterable with `Symbol.iterator`

If an object implements `Symbol.iterator`, it can be used with `for...of`, spread syntax, and other iteration constructs.

```javascript
const range = {
  from: 1,
  to: 4,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    // The iterator object
    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { done: true };
      },
    };
  },
};

for (const n of range) {
  console.log(n);
}
// 1
// 2
// 3
// 4

console.log([...range]); // [1, 2, 3, 4]
```

You can build custom collections that feel like arrays in terms of iteration.

```javascript
const collection2 = {
  items: ['a', 'b', 'c'],
  [Symbol.iterator]() {
    let index = 0;
    const items = this.items;
    return {
      next() {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { done: true };
      },
    };
  },
};

for (const item of collection2) {
  console.log(item);
}
// "a"
// "b"
// "c"
```

## Combining Symbols, Prototypes, and Iterators

Here’s a small custom collection that stores unique values (like a Set) and is iterable.

```javascript
const UniqueCollectionProto = {
  add(value) {
    if (!this._values.includes(value)) {
      this._values.push(value);
    }
  },
  has(value) {
    return this._values.includes(value);
  },
  // Implement iteration using Symbol.iterator
  [Symbol.iterator]() {
    let index = 0;
    const values = this._values;
    return {
      next() {
        if (index < values.length) {
          return { value: values[index++], done: false };
        }
        return { done: true };
      },
    };
  },
};

function createUniqueCollection() {
  const instance = Object.create(UniqueCollectionProto);
  instance._values = []; // internal storage
  return instance;
}

const coll = createUniqueCollection();
coll.add('a');
coll.add('b');
coll.add('a'); // ignored duplicate

console.log(coll.has('a')); // true
console.log(coll.has('c')); // false

console.log([...coll]); // ['a', 'b']
```

Symbols and advanced object hooks like `Symbol.iterator` and `Symbol.toStringTag` let you build abstractions that integrate smoothly with native JavaScript syntax, making your custom objects feel like built-in types.
