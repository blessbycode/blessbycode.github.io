---
title: 'Prototypes, Inheritance, and this in JavaScript Objects'
published: 2026-01-12
draft: false
description: 'Understand how JavaScript objects inherit behavior through prototypes and how this works inside methods, with concrete examples.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

JavaScript uses **prototypal inheritance**: objects can delegate to other objects for missing properties. Combined with the `this` keyword, this is how methods, “classes”, and shared behavior work under the hood.

## Prototypes with `Object.create`

Every object has an internal prototype link, which you can inspect with `Object.getPrototypeOf` and set with `Object.create`.

```javascript
// A prototype object with shared behavior
const animal = {
  eats: true,
  walk() {
    console.log('Animal is walking');
  },
};

// dog's prototype is animal
const dog = Object.create(animal);
dog.name = 'Rex';
dog.barks = true;

console.log(dog.eats); // true (comes from prototype)
dog.walk(); // "Animal is walking"

console.log(Object.getPrototypeOf(dog) === animal); // true
```

When you access `dog.eats`, JavaScript checks `dog` first. If the property isn’t there, it walks up the **prototype chain** to `animal`, then further up to `Object.prototype`, and finally to `null`.

## Constructor Functions and `new`

Before `class` syntax existed, constructor functions were the main way to create multiple similar objects with shared behavior.

```javascript
// A constructor function (capitalized by convention)
function User(name) {
  // `this` is a new object when called with `new`
  this.name = name;
}

// Methods defined on the prototype are shared by all instances
User.prototype.greet = function () {
  console.log(`Hi, I'm ${this.name}.`);
};

const ada = new User('Ada');
const grace = new User('Grace');

ada.greet(); // "Hi, I'm Ada."
grace.greet(); // "Hi, I'm Grace."

console.log(Object.getPrototypeOf(ada) === User.prototype); // true
```

All instances created with `new User` share the same `greet` function via `User.prototype`, which is more memory‑efficient than copying the function onto each instance.

## How `this` Works in Methods

In regular functions, `this` depends on **how** the function is called, not where it’s defined. For methods called as `obj.method()`, `this` usually refers to `obj`.

```javascript
const user = {
  name: 'Ada',
  greet() {
    console.log(this.name);
  },
};

user.greet(); // "Ada"  (`this` === user)

const fn = user.greet;
fn(); // In strict mode: `this` is undefined
```

If you want to keep `this` pointing at an object even when you pass the method around, use `Function.prototype.bind`.

```javascript
const user2 = {
  name: 'Bob',
  sayName() {
    console.log(this.name);
  },
};

// Bind `this` to user2 permanently
const boundSayName = user2.sayName.bind(user2);

boundSayName(); // "Bob"
setTimeout(boundSayName, 0); // "Bob" (still bound)
```

## Arrow Functions and `this`

Arrow functions **do not** have their own `this`. They capture `this` from the surrounding lexical scope. This is great for callbacks but often wrong for object methods.

```javascript
const brokenUser = {
  name: 'Ada',
  // Arrow function here does NOT bind `this` to the object
  greet: () => {
    console.log(this.name);
  },
};

brokenUser.greet(); // likely undefined; `this` is not `brokenUser`
```

Use regular methods when you need `this` to be the object.

```javascript
const correctUser = {
  name: 'Ada',
  greet() {
    console.log(this.name);
  },
};

correctUser.greet(); // "Ada"
```

## A Small Inheritance Example with Prototypes

You can build prototype chains manually without classes.

```javascript
const vehicle = {
  move() {
    console.log('Vehicle is moving');
  },
};

const carProto = Object.create(vehicle);
carProto.wheels = 4;
carProto.honk = function () {
  console.log('Beep beep!');
};

const myCar = Object.create(carProto);
myCar.brand = 'Toyota';

myCar.move(); // "Vehicle is moving" (from vehicle)
myCar.honk(); // "Beep beep!" (from carProto)
console.log(myCar.wheels); // 4       (from carProto)
```

Understanding prototypes and `this` is crucial for reading both old‑style constructor code and modern `class`‑based code, since classes are just syntactic sugar over this prototype system.
