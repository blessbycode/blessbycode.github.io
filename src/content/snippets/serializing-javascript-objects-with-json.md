---
title: 'Serializing JavaScript Objects with JSON'
published: 2026-01-12
draft: false
description: 'Convert JavaScript objects to and from JSON safely, restoring dates and excluding sensitive fields.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Most APIs and storage systems use **JSON**. In JavaScript, you use `JSON.stringify` and `JSON.parse` to convert between objects and JSON strings. Understanding what gets included—and what doesn’t—is essential.

## `JSON.stringify` – Object → JSON String

`JSON.stringify` converts a JavaScript value into a JSON string.

```javascript
const user = {
  id: 1,
  name: 'Ada',
  password: 'secret',
  createdAt: new Date('1843-01-01'),
  sayHi() {
    console.log('Hi!');
  },
};

const json = JSON.stringify(user);
console.log(json);
// {"id":1,"name":"Ada","password":"secret","createdAt":"1843-01-01T00:00:00.000Z"}
```

Key details:

- Functions (`sayHi`) and symbols are **omitted**.
- Dates become ISO strings.
- Only **enumerable own properties** are included by default.

## `JSON.parse` – JSON String → Object

`JSON.parse` turns a JSON string back into a plain object.

```javascript
const parsed = JSON.parse(json);

console.log(parsed.name); // "Ada"
console.log(parsed.createdAt); // string, not Date
```

If you want to restore certain types (like Dates), use a **reviver** function.

```javascript
const revived = JSON.parse(json, (key, value) => {
  if (key === 'createdAt') {
    // Turn ISO string back into a Date
    return new Date(value);
  }
  return value;
});

console.log(revived.createdAt instanceof Date); // true
```

## Excluding Sensitive Data with a Replacer

You can control serialization by passing a **replacer** function to `JSON.stringify`.

```javascript
const safeUser = {
  id: 1,
  name: 'Ada',
  password: 'super-secret',
  token: 'TOP_SECRET_TOKEN',
};

const safeJson = JSON.stringify(
  safeUser,
  (key, value) => {
    // Omit sensitive fields from JSON
    if (key === 'password' || key === 'token') {
      return undefined;
    }
    return value;
  },
  2, // pretty-print with 2 spaces
);

console.log(safeJson);
// {
//   "id": 1,
//   "name": "Ada"
// }
```

## Custom `toJSON` Methods

Objects can define a `toJSON` method that controls what gets serialized.

```javascript
const userWithCustomToJSON = {
  id: 1,
  name: 'Ada',
  password: 'super-secret',
  toJSON() {
    // Return a safe view of the object
    const { password, ...safe } = this;
    return safe;
  },
};

const jsonString = JSON.stringify(userWithCustomToJSON);
console.log(jsonString);
// {"id":1,"name":"Ada"}
```

This is useful when you want a single place to define the “public” view of an object.

## Serializing and Restoring Complex Shapes

For more control, you can use both replacer and reviver to tag and restore special values.

```javascript
const data = {
  id: 1,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 1000 * 60),
};

// Tag Date instances during stringify
const tagged = JSON.stringify(
  data,
  (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  },
  2,
);

console.log(tagged);

// Restore Date instances during parse
const restored = JSON.parse(tagged, (key, value) => {
  if (value && value.__type === 'Date') {
    return new Date(value.value);
  }
  return value;
});

console.log(restored.createdAt instanceof Date); // true
console.log(restored.expiresAt instanceof Date); // true
```

With these patterns, you can safely send objects over the network, persist them in localStorage, and restore them later with the right types and without leaking sensitive information.
