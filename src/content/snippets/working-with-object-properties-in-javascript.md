---
title: 'Working with Object Properties in JavaScript'
published: 2026-01-08
draft: false
description: 'Add, read, update, delete, and check properties on JavaScript objects using dot and bracket notation with clear examples.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Most daily work with objects is about **properties**: reading, writing, deleting, and checking them. JavaScript gives you flexible ways to do all of these.

## Dot vs Bracket Notation

Use **dot notation** for simple identifiers and **bracket notation** for dynamic or special keys.

```javascript
const user = { 'first name': 'Ada', age: 36 };
const prop = 'age';

// Dot notation: only for valid identifiers
console.log(user.age); // 36

// Bracket notation: works with dynamic names and special characters
console.log(user[prop]); // 36  (using a variable)
console.log(user['first name']); // "Ada" (space in key)
```

Bracket notation is also handy when building objects in loops or from configuration.

```javascript
// Build an object from an array of key-value pairs
const entries = [
  ['id', 1],
  ['name', 'Ada'],
  ['role', 'admin'],
];

const obj = {};

for (const [key, value] of entries) {
  obj[key] = value; // dynamic key using bracket notation
}

console.log(obj); // { id: 1, name: 'Ada', role: 'admin' }
```

## Adding and Updating Properties

Just assign to a property. If it doesn’t exist, it’s created; if it exists, it’s updated.

```javascript
const userProfile = {};

// Add new properties
userProfile.name = 'Ada';
userProfile['age'] = 36;

console.log(userProfile); // { name: 'Ada', age: 36 }

// Update existing property
userProfile.age = 37;

console.log(userProfile.age); // 37
```

You can also add methods after the object is created.

```javascript
const car = {
  brand: 'Tesla',
  model: 'Model 3',
};

// Add a method dynamically
car.start = function () {
  console.log(`Starting ${this.brand} ${this.model}`);
};

car.start(); // "Starting Tesla Model 3"
```

## Deleting Properties with `delete`

Use the `delete` operator to remove a property from an object.

```javascript
const settings = {
  darkMode: true,
  showSidebar: true,
};

delete settings.showSidebar;

console.log(settings); // { darkMode: true }
console.log('showSidebar' in settings); // false
```

`delete` only affects the object’s own properties; it won’t remove properties from the prototype.

## Checking If a Property Exists

### `in` Operator

The `in` operator checks if a property exists **anywhere** on the object, including its prototype chain.

```javascript
const proto = { inherited: 1 };
const obj = Object.create(proto);
obj.own = 2;

console.log('own' in obj); // true  (own property)
console.log('inherited' in obj); // true  (from prototype)
console.log('missing' in obj); // false
```

### `hasOwnProperty` and `Object.hasOwn`

These check only **own** properties (not inherited).

```javascript
const base = { inherited: 1 };
const child = Object.create(base);
child.own = 2;

console.log(child.hasOwnProperty('own')); // true
console.log(child.hasOwnProperty('inherited')); // false

console.log(Object.hasOwn(child, 'own')); // true (modern, safer)
console.log(Object.hasOwn(child, 'inherited')); // false
```

### `in` vs Comparing to `undefined`

You can’t rely on `obj.prop !== undefined` to tell if a property exists, because the property might be explicitly set to `undefined`.

```javascript
const config = { featureEnabled: undefined };

console.log('featureEnabled' in config); // true
console.log(config.featureEnabled !== undefined); // false
```

If you care about existence vs value, prefer `in` or `Object.hasOwn`.

## A Small Practical Example

Here’s a small function that safely reads a nested property with a default if it’s missing.

```javascript
// Safe getter for nested properties using bracket notation and 'in'
function getNested(obj, path, defaultValue) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }

  return current;
}

const settingsObj = {
  user: {
    theme: {
      name: 'dark',
    },
  },
};

console.log(getNested(settingsObj, 'user.theme.name', 'light')); // "dark"
console.log(getNested(settingsObj, 'user.layout.type', 'single')); // "single"
```
