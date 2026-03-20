---
title: 'Converting and Transforming JavaScript Objects'
published: 2026-01-12
draft: false
description: 'Convert JavaScript objects to arrays, Maps, class instances, and reshaped forms using real-world patterns.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Objects rarely stay in a single shape. In real apps you often convert between **objects, arrays, Maps, and class instances**, or reshape data coming from APIs. This snippet shows practical patterns for doing that.

## Objects and Arrays with `Object.entries` / `Object.fromEntries`

You can turn an object into an array of `[key, value]` pairs and back again.

```javascript
const user = { id: 1, name: 'Ada', role: 'admin' };

// Object → array of [key, value]
const entries = Object.entries(user);
console.log(entries);
// [['id', 1], ['name', 'Ada'], ['role', 'admin']]

// Array of [key, value] → object
const fromEntries = Object.fromEntries(entries);
console.log(fromEntries); // { id: 1, name: 'Ada', role: 'admin' }
```

This is very powerful when combined with array methods for transforming data.

```javascript
const settings = { retries: 2, timeout: 1000, label: 'api' };

// Multiply all numeric settings by 10
const scaled = Object.fromEntries(
  Object.entries(settings).map(([key, value]) => {
    if (typeof value === 'number') {
      return [key, value * 10];
    }
    return [key, value];
  }),
);

console.log(scaled);
// { retries: 20, timeout: 10000, label: 'api' }
```

## Grouping an Array into an Object

Convert an array of objects into an object keyed by `id` for O(1) lookup.

```javascript
const users = [
  { id: 1, name: 'Ada', role: 'admin' },
  { id: 2, name: 'Grace', role: 'user' },
  { id: 3, name: 'Linus', role: 'user' },
];

const byId = users.reduce((acc, user) => {
  acc[user.id] = user;
  return acc;
}, {});

console.log(byId[2].name); // "Grace"
```

Or group by role:

```javascript
const byRole = users.reduce((acc, user) => {
  const { role } = user;
  if (!acc[role]) acc[role] = [];
  acc[role].push(user);
  return acc;
}, {});

console.log(byRole.admin); // [{ id: 1, name: 'Ada', role: 'admin' }]
console.log(byRole.user.length); // 2
```

## Objects and Maps

`Map` is great when you need keys that aren’t just strings and when insertion order matters more predictably.

```javascript
const plain = { a: 1, b: 2 };

// Object → Map
const map = new Map(Object.entries(plain));
console.log(map.get('a')); // 1

// Map → Object
const backToObject = Object.fromEntries(map);
console.log(backToObject); // { a: 1, b: 2 }
```

## Nested Object ↔ Nested Map

You can recursively convert nested objects into nested Maps.

```javascript
function objectToMap(obj) {
  const map = new Map();
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Convert nested objects to nested Maps
      map.set(key, objectToMap(value));
    } else {
      map.set(key, value);
    }
  }
  return map;
}

function mapToObject(map) {
  const obj = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value instanceof Map ? mapToObject(value) : value;
  }
  return obj;
}

const nested = {
  user: { name: 'Ada', age: 36 },
  settings: { theme: 'dark' },
};

const nestedMap = objectToMap(nested);
const again = mapToObject(nestedMap);

console.log(again); // back to plain object shape
```

## Plain Objects → Class Instances

APIs typically return plain JSON objects. You can wrap them in classes to add behavior and validation.

```javascript
class User {
  constructor({ id, name, role }) {
    this.id = id;
    this.name = name;
    this.role = role;
  }

  isAdmin() {
    return this.role === 'admin';
  }
}

const response = { id: 1, name: 'Ada', role: 'admin' };

const userObj = new User(response);
console.log(userObj.isAdmin()); // true
```

For nested objects, you can wrap those too:

```javascript
class Address {
  constructor({ city, country }) {
    this.city = city;
    this.country = country;
  }
}

class Profile {
  constructor({ id, name, address }) {
    this.id = id;
    this.name = name;
    this.address = new Address(address);
  }
}

const apiUser = {
  id: 'u-123',
  name: 'Ada',
  address: { city: 'London', country: 'UK' },
};

const profile = new Profile(apiUser);
console.log(profile.address.city); // "London"
```

## Flattening and Unflattening Objects

Flatten nested objects into a one‑level object with dotted keys.

```javascript
function flatten(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested objects
      flatten(value, path, result);
    } else {
      result[path] = value;
    }
  }
  return result;
}

const nestedObj = {
  user: {
    name: 'Ada',
    address: { city: 'London', zip: '12345' },
  },
};

const flat = flatten(nestedObj);
console.log(flat);
// {
//   'user.name': 'Ada',
//   'user.address.city': 'London',
//   'user.address.zip': '12345'
// }
```

And reverse the process:

```javascript
function unflatten(flat) {
  const result = {};
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split('.');
    let current = result;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value;
      } else {
        // Create nested objects as needed
        current[key] ||= {};
        current = current[key];
      }
    });
  }
  return result;
}

const rebuilt = unflatten(flat);
console.log(rebuilt);
```

These patterns are the backbone of everyday data‑shaping work in JavaScript—turning API responses into view models, indexing arrays by keys, and converting between different storage formats.
