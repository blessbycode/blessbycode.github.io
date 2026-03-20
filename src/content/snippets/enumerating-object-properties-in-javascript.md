---
title: 'Enumerating Object Properties in JavaScript'
published: 2026-01-08
draft: false
description: 'Iterate over JavaScript object properties using for...in, Object.keys, Object.entries, and more, with clear examples.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Once an object has data, you often need to **iterate over its properties**—for logging, transforming, or validating. JavaScript gives you multiple tools, each with slightly different behavior.

## `for...in` Loop

`for...in` iterates over **enumerable** properties, including those found on the prototype chain.

```javascript
const proto = { inherited: true };
const obj = Object.create(proto);
obj.own = 'value';

for (const key in obj) {
  console.log(key);
}
// "own"
// "inherited" (comes from prototype)
```

If you only care about **own** properties, filter inside the loop:

```javascript
for (const key in obj) {
  if (Object.hasOwn(obj, key)) {
    console.log(key);
  }
}
// "own"
```

Because `for...in` includes inherited properties, it’s rarely the best choice for plain objects unless you explicitly want that behavior.

## `Object.keys`, `Object.values`, `Object.entries`

These helpers only look at **own**, **enumerable**, string‑keyed properties.

```javascript
const user = {
  id: 1,
  name: 'Ada',
  role: 'admin',
};

console.log(Object.keys(user)); // ['id', 'name', 'role']
console.log(Object.values(user)); // [1, 'Ada', 'admin']
console.log(Object.entries(user)); // [['id', 1], ['name', 'Ada'], ['role', 'admin']]
```

You can combine `Object.entries` with array methods to transform objects in a functional style.

```javascript
// Double all numeric values in an object
const obj = { a: 1, b: 2, label: 'counter' };

const doubled = Object.fromEntries(
  Object.entries(obj).map(([key, value]) => {
    // Only double numbers; leave everything else as-is
    if (typeof value === 'number') {
      return [key, value * 2];
    }
    return [key, value];
  }),
);

console.log(doubled); // { a: 2, b: 4, label: 'counter' }
```

## Non‑Enumerable and Symbol Properties

Not all properties show up in `for...in` or `Object.keys`. Some are **non‑enumerable**, and some use **symbol** keys.

```javascript
const sym = Symbol('id');

const obj2 = {};

// Define a non-enumerable property
Object.defineProperty(obj2, 'hidden', {
  value: 123,
  enumerable: false,
});

// Define a symbol-keyed property
obj2[sym] = 456;

console.log(Object.keys(obj2)); // []  (neither property shows up)
console.log(Object.getOwnPropertyNames(obj2)); // ['hidden']
console.log(Object.getOwnPropertySymbols(obj2)); // [Symbol(id)]
```

Use these functions when you need a complete view of an object’s own properties, including non‑enumerable ones.

## A Practical Example: Logging All Own Properties

Here’s a helper that logs all own properties (string keys and symbol keys), including non‑enumerable ones.

```javascript
function logAllOwnProperties(obj) {
  // String-keyed properties (including non-enumerable)
  const names = Object.getOwnPropertyNames(obj);
  // Symbol-keyed properties
  const symbols = Object.getOwnPropertySymbols(obj);

  for (const name of names) {
    const value = obj[name];
    console.log(`name: ${name}, value:`, value);
  }

  for (const sym of symbols) {
    const value = obj[sym];
    console.log(`symbol: ${String(sym)}, value:`, value);
  }
}

const secretId = Symbol('secretId');

const userWithSecrets = {};
Object.defineProperty(userWithSecrets, 'passwordHash', {
  value: 'hash123',
  enumerable: false,
});
userWithSecrets[secretId] = 'super-secret';

logAllOwnProperties(userWithSecrets);
```

In most application code you’ll reach for `Object.keys` or `Object.entries`, but understanding how enumeration really works makes debugging and metaprogramming much easier.
