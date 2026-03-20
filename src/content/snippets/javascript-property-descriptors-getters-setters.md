---
title: 'JavaScript Property Descriptors, Getters, and Setters'
published: 2026-01-12
draft: false
description: 'Control how JavaScript object properties behave using descriptors, getters, and setters, with real-world examples.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

Under the hood, every JavaScript property has a **descriptor** that tells the engine how that property behaves: whether it can be changed, deleted, listed, or computed on the fly. You can inspect and customize these descriptors for more control.

## Inspecting Property Descriptors

Use `Object.getOwnPropertyDescriptor` to see how a property is defined.

```javascript
const obj = { a: 1 };

const desc = Object.getOwnPropertyDescriptor(obj, 'a');
console.log(desc);
// {
//   value: 1,
//   writable: true,    // can change value
//   enumerable: true,  // shows up in Object.keys / for...in
//   configurable: true // descriptor can be changed/deleted
// }
```

## Creating Custom Properties with `Object.defineProperty`

`Object.defineProperty` lets you control each descriptor flag for a property.

```javascript
const user = {};

Object.defineProperty(user, 'id', {
  value: 123,
  writable: false, // read-only value
  enumerable: false, // hidden from Object.keys
  configurable: false, // cannot redefine or delete
});

console.log(user.id); // 123

// This assignment is ignored (or throws in strict mode)
user.id = 456;
console.log(user.id); // still 123

console.log(Object.keys(user)); // []  (id is non-enumerable)
```

You can make multiple properties at once with `Object.defineProperties`.

```javascript
const settings = {};

Object.defineProperties(settings, {
  theme: {
    value: 'dark',
    writable: true,
    enumerable: true,
  },
  version: {
    value: '1.0.0',
    writable: false, // read-only
    enumerable: true,
  },
});

console.log(settings.theme); // "dark"
console.log(settings.version); // "1.0.0"
```

## Getters and Setters in Object Literals

Getters and setters define **accessor properties** whose value is computed or controlled rather than stored directly.

```javascript
const userProfile = {
  firstName: 'Ada',
  lastName: 'Lovelace',

  // Getter: runs when you read userProfile.fullName
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  // Setter: runs when you assign to userProfile.fullName
  set fullName(value) {
    const [first, last] = value.split(' ');
    this.firstName = first;
    this.lastName = last ?? '';
  },
};

console.log(userProfile.fullName); // "Ada Lovelace"

userProfile.fullName = 'Grace Hopper';
console.log(userProfile.firstName); // "Grace"
console.log(userProfile.lastName); // "Hopper"
```

## Getters and Setters with `Object.defineProperty`

You can also use descriptors to define getters and setters after an object is created.

```javascript
const product = {
  priceCents: 1299, // internal data in cents
};

Object.defineProperty(product, 'price', {
  get() {
    // Convert cents to a number of dollars
    return this.priceCents / 100;
  },
  set(value) {
    // Store incoming value in cents
    this.priceCents = Math.round(value * 100);
  },
  enumerable: true,
});

console.log(product.price); // 12.99

product.price = 19.99; // calls setter
console.log(product.priceCents); // 1999
console.log(product.price); // 19.99
```

## A Realistic Example: Validating with a Setter

You can use setters to enforce invariants, like “age can’t be negative”.

```javascript
const person = {
  _age: 0, // conventionally "private" backing field

  get age() {
    return this._age;
  },

  set age(value) {
    if (value < 0) {
      throw new Error('Age must be non-negative');
    }
    this._age = value;
  },
};

person.age = 25; // OK
console.log(person.age); // 25

try {
  person.age = -5; // throws
} catch (err) {
  console.error(err.message); // "Age must be non-negative"
}
```

Descriptors, getters, and setters give you low‑level control over how properties behave, which is especially useful when building libraries, frameworks, or enforcing domain rules in your data models.
