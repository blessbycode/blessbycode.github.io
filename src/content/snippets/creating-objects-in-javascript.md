---
title: 'Creating Objects in JavaScript'
published: 2026-01-08
draft: false
description: 'Learn different ways to create JavaScript objects using literals, constructors, and Object.create, with practical examples.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

There are several ways to create objects in JavaScript. The most common and recommended is the **object literal**, but you’ll also see `new Object()` and `Object.create` in real code. Understanding each style helps you read any JavaScript codebase.

## Object Literal `{}` (Most Common)

The **object literal** is the simplest and most readable way to create objects.

```javascript
// An empty object literal
const empty = {};

// An object with some basic properties
const point = {
  x: 10,
  y: 20,
};

console.log(point.x, point.y); // 10 20
```

You can use **shorthand properties** and **method shorthand** to remove repetition.

```javascript
const name = 'Ada';
const age = 36;

const user = {
  // Shorthand properties (name: name, age: age)
  name,
  age,

  // Shorthand method syntax
  greet() {
    console.log(`Hi, I'm ${this.name} and I'm ${this.age}.`);
  },
};

user.greet(); // "Hi, I'm Ada and I'm 36."
```

You can also compute property names dynamically using **computed property keys**.

```javascript
const key = 'favorite-color';
const answer = 42;

const obj = {
  [key]: 'blue', // "favorite-color": "blue"
  ['answer' + answer]: 'life', // "answer42": "life"
};

console.log(obj['favorite-color']); // "blue"
console.log(obj.answer42); // "life"
```

## `new Object()` (Older but Rarely Needed)

You can create objects with the `Object` constructor, but the literal `{}` is almost always better.

```javascript
// Using the Object constructor
const user = new Object();

// Add properties after creation
user.name = 'Ada';
user.age = 36;

console.log(user); // { name: 'Ada', age: 36 }
```

The literal version is shorter and clearer:

```javascript
const userLiteral = { name: 'Ada', age: 36 };
```

## `Object.create(proto)` for Custom Prototypes

`Object.create` creates a new object whose prototype is the object you pass in. This is a very direct way to work with JavaScript’s prototype system.

```javascript
// A prototype object with shared behavior
const personProto = {
  greet() {
    console.log(`Hello, I'm ${this.name}.`);
  },
};

// Create a new object that delegates to personProto
const ada = Object.create(personProto);
ada.name = 'Ada';

ada.greet(); // "Hello, I'm Ada."

console.log(Object.getPrototypeOf(ada) === personProto); // true
```

You can also define properties with **descriptors** when creating the object.

```javascript
const userWithId = Object.create(personProto, {
  name: {
    value: 'Ada',
    writable: true, // name can be changed
    enumerable: true, // shows up in Object.keys
    configurable: true, // descriptor can be changed/deleted
  },
  id: {
    value: 123,
    writable: false, // read-only
    enumerable: false, // hidden from Object.keys
    configurable: false, // can’t be reconfigured
  },
});

console.log(userWithId.name); // "Ada"
console.log(userWithId.id); // 123

userWithId.name = 'Grace';
console.log(userWithId.name); // "Grace"
```

## Factory Functions Returning Objects

Another common pattern is a **factory function**: a regular function that creates and returns an object.

```javascript
// A simple factory function for users
function createUser(name, role = 'user') {
  return {
    name,
    role,
    describe() {
      console.log(`${this.name} is a ${this.role}`);
    },
  };
}

const alice = createUser('Alice', 'admin');
const bob = createUser('Bob');

alice.describe(); // "Alice is a admin"
bob.describe(); // "Bob is a user"
```

Factory functions play nicely with dependency injection, testing, and functional programming, and they avoid the need for `new`.
