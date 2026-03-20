---
title: 'ES2015 and Beyond - Part 1'
published: 2026-01-14
draft: false
description: 'JavaScript has transformed dramatically since ES2015 (ES6) was released. What was once a language notorious for quirks and verbose syntax has become one of the most expressive, powerful, and developer-friendly languages in existence. Follow this 3-part comprehensive guide to learn all about ES2015 and next.'
toc: true
series: 'ES2015 and next'
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

## How JavaScript Versions Work

Before diving in, a quick orientation on how JavaScript evolves. The language is governed by **TC39**, a committee of browser vendors, developers, and companies. They maintain the **ECMAScript** specification — the formal standard that all JavaScript engines implement.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                     TC39 PROPOSAL STAGES                                 │
│                                                                          │
│  Stage 0: Strawperson   → Just an idea, informal discussion             │
│  Stage 1: Proposal      → Champion identified, problem statement clear  │
│  Stage 2: Draft         → Initial spec text, experimental impl. OK      │
│  Stage 3: Candidate     → Spec complete, browsers begin implementing    │
│  Stage 4: Finished      → Two independent implementations, ships next   │
│                           ECMAScript edition                            │
│                                                                          │
│  Yearly release cycle: Features reaching Stage 4 by January each year  │
│  are included in that year's ECMAScript edition.                        │
│  ES2015 = ES6, ES2016 = ES7, ... ES2025 = ES16                         │
└──────────────────────────────────────────────────────────────────────────┘
```

:::note
The old naming convention (ES5, ES6, ES7) gave way to year-based naming starting with ES2015. You'll see both used — they refer to the same things. ES6 = ES2015, ES7 = ES2016, and so on.
:::

## ES2015 (ES6) — The Big Bang

ES2015 was the largest single update to JavaScript in the language's history. It took six years to finalize (ES5 was 2009, ES2015 was 2015) and introduced dozens of features that completely changed how JavaScript is written.

## let and const — Block-Scoped Variables

`var` has function scope and is hoisted with a value of `undefined`. `let` and `const` have **block scope** and live in the Temporal Dead Zone until their declaration line.

```javascript
// ── var: function scoped, error-prone ─────────────────────────────────
function oldWay() {
  if (true) {
    var name = 'Alice'; // hoisted to function scope
  }
  console.log(name); // 'Alice' — leaks out of the if block!
}

// ── let: block scoped, mutable ────────────────────────────────────────
function newWay() {
  if (true) {
    let name = 'Alice'; // block scoped
    name = 'Bob'; // reassignment is allowed
  }
  console.log(name); // ReferenceError — name is not accessible here ✅
}

// ── const: block scoped, binding is immutable ─────────────────────────
const PI = 3.14159;
PI = 3; // TypeError: Assignment to constant variable ❌

// IMPORTANT: const prevents reassignment of the binding,
// NOT mutation of the value
const user = { name: 'Alice' };
user.name = 'Bob'; // ✅ allowed — you're mutating the object, not the binding
user = {}; // ❌ TypeError — you're trying to reassign the binding

const numbers = [1, 2, 3];
numbers.push(4); // ✅ allowed — mutating the array
numbers = []; // ❌ TypeError — reassigning the binding
```

:::tip
The modern rule: use `const` by default for everything. Only switch to `let` when you know the variable needs to be reassigned (like a counter in a loop). Never use `var` in new code.
:::

## Arrow Functions — Concise Syntax and Lexical this

Arrow functions are a shorter syntax for function expressions — and they fix one of JavaScript's most confusing behaviors: `this` binding.

```javascript
// ── Syntax forms ───────────────────────────────────────────────────────
const double = (x) => x * 2; // one param, implicit return
const add = (a, b) => a + b; // multiple params
const greet = (name) => `Hello, ${name}!`; // with template literal
const noop = () => {}; // no params, empty body
const getUser = () => ({ name: 'Alice' }); // return object literal: wrap in ()

// ── Multi-line body: requires return keyword ───────────────────────────
const processItems = (items) => {
  const filtered = items.filter((item) => item.active);
  return filtered.map((item) => item.name);
};

// ── The real superpower: lexical this ────────────────────────────────
// Problem with regular functions: 'this' changes based on how the function is called
function Timer() {
  this.seconds = 0;

  // ❌ Old way — 'this' inside setInterval refers to the global object, not Timer
  setInterval(function () {
    this.seconds++; // 'this' is window/undefined in strict mode — BROKEN
  }, 1000);
}

function TimerFixed() {
  this.seconds = 0;

  // ✅ Arrow function: 'this' is inherited from the enclosing scope (TimerFixed)
  setInterval(() => {
    this.seconds++; // 'this' correctly refers to the TimerFixed instance ✅
  }, 1000);
}

// ── Arrow functions are NOT suitable for everything ────────────────────
const obj = {
  name: 'Alice',
  // ❌ Arrow function as a method: 'this' refers to outer scope, not obj
  greetArrow: () => {
    console.log(this.name); // undefined — 'this' is the module/global scope
  },
  // ✅ Regular function as a method: 'this' refers to obj
  greetRegular() {
    console.log(this.name); // 'Alice' ✅
  },
};
```

:::warning
Arrow functions cannot be used as constructors (`new ArrowFn()` throws), don't have their own `arguments` object, and don't have a `prototype` property. They also cannot be used as generator functions. For methods, constructors, and functions that need dynamic `this`, use regular functions.
:::

## Template Literals — String Superpowers

Template literals (backtick strings) allow embedded expressions, multiline strings, and tagged templates.

```javascript
const name = 'Alice';
const age = 30;

// ── String interpolation: embed any expression ────────────────────────
const message = `Hello, ${name}! You are ${age} years old.`;
const math = `2 + 2 = ${2 + 2}`;
const conditional = `Status: ${age >= 18 ? 'adult' : 'minor'}`;
const method = `Name: ${name.toUpperCase()}`;

// ── Multiline strings: no more \n concatenation ───────────────────────
const html = `
  <div class="card">
    <h2>${name}</h2>
    <p>Age: ${age}</p>
  </div>
`;

// ── Tagged templates: custom string processing ────────────────────────
// A tag function receives the string parts and interpolated values separately
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i] !== undefined ? `<mark>${values[i]}</mark>` : '';
    return result + str + value;
  }, '');
}

const item = 'JavaScript';
const count = 42;
const output = highlight`Found ${count} results for ${item}`;
// → 'Found <mark>42</mark> results for <mark>JavaScript</mark>'

// ── Practical tagged template: SQL query sanitization ─────────────────
function sql(strings, ...values) {
  // In a real implementation, this would properly sanitize values
  // to prevent SQL injection
  const query = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] !== undefined ? `$${i}` : '');
  }, '');
  return { query, params: values };
}

const userId = 42;
const { query, params } = sql`SELECT * FROM users WHERE id = ${userId}`;
```

## Destructuring — Unpack Values Elegantly

Destructuring lets you unpack values from arrays and properties from objects into distinct variables.

```javascript
// ── Object destructuring ───────────────────────────────────────────────
const user = { name: 'Alice', age: 30, city: 'London', role: 'admin' };

// Basic destructuring
const { name, age } = user;
console.log(name); // 'Alice'
console.log(age); // 30

// Rename while destructuring
const { name: userName, city: userCity } = user;
console.log(userName); // 'Alice'
console.log(userCity); // 'London'

// Default values (used when the property is undefined)
const { name: n, score = 100 } = user; // score not in user → defaults to 100
console.log(score); // 100

// Nested destructuring
const settings = {
  theme: { color: 'blue', font: 'Arial' },
  notifications: { email: true, sms: false },
};
const {
  theme: { color, font },
  notifications: { email },
} = settings;

// Rest in object destructuring
const { name: fullName, ...rest } = user;
console.log(rest); // { age: 30, city: 'London', role: 'admin' }

// ── Array destructuring ────────────────────────────────────────────────
const coordinates = [40.7128, -74.006, 10];

const [latitude, longitude] = coordinates;
console.log(latitude); // 40.7128
console.log(longitude); // -74.0060

// Skip elements with commas
const [first, , third] = [1, 2, 3];
console.log(first); // 1
console.log(third); // 3

// Rest in array destructuring
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head); // 1
console.log(tail); // [2, 3, 4, 5]

// Swapping variables (no temp variable needed)
let a = 1,
  b = 2;
[a, b] = [b, a];
console.log(a); // 2
console.log(b); // 1

// ── Destructuring in function parameters ──────────────────────────────
function renderUser({ name, age, role = 'guest' }) {
  return `${name} (${age}) — ${role}`;
}
console.log(renderUser({ name: 'Bob', age: 25 })); // 'Bob (25) — guest'

// ── Destructuring with iterables (arrays from functions) ──────────────
function getMinMax(numbers) {
  return [Math.min(...numbers), Math.max(...numbers)];
}
const [min, max] = getMinMax([3, 1, 4, 1, 5, 9, 2, 6]);
```

## Default Parameters — Sane Function Defaults

```javascript
// ── Old way: manually checking arguments ──────────────────────────────
function greetOld(name, greeting) {
  name = name || 'World';
  greeting = greeting || 'Hello';
  return `${greeting}, ${name}!`;
}

// ── New way: default parameters ───────────────────────────────────────
function greet(name = 'World', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

greet(); // 'Hello, World!'
greet('Alice'); // 'Hello, Alice!'
greet('Alice', 'Howdy'); // 'Howdy, Alice!'
greet(undefined, 'Hey'); // 'Hey, World!' — undefined triggers the default

// ── Default parameters can reference earlier parameters ───────────────
function createRange(start = 0, end = start + 10) {
  return { start, end };
}
createRange(); // { start: 0, end: 10 }
createRange(5); // { start: 5, end: 15 }

// ── Default parameters can be expressions or function calls ───────────
const generateId = () => Math.random().toString(36).slice(2);

function createUser(name, id = generateId()) {
  return { name, id };
}
```

:::note
`null` does NOT trigger default parameters — only `undefined` does. This is an important distinction: `greet(null, 'Hi')` gives `'Hi, null!'`, not `'Hi, World!'`.
:::

## Rest Parameters and the Spread Operator

The `...` syntax serves two opposite purposes: **rest** collects multiple values into an array, **spread** expands an iterable into individual values.

```javascript
// ── Rest parameters: collect remaining arguments ──────────────────────
function sum(...numbers) {
  // numbers is a real array (unlike the old arguments object)
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4, 5); // 15

function logWithPrefix(prefix, ...messages) {
  messages.forEach((msg) => console.log(`[${prefix}] ${msg}`));
}
logWithPrefix('INFO', 'Server started', 'Port: 3000', 'Ready');

// ── Spread in function calls ───────────────────────────────────────────
const nums = [3, 1, 4, 1, 5, 9, 2, 6];

Math.max(...nums); // 9 (instead of Math.max.apply(null, nums))
console.log('Values:', ...nums); // spread as multiple arguments

// ── Spread in array literals ───────────────────────────────────────────
const first = [1, 2, 3];
const second = [4, 5, 6];

const combined = [...first, ...second]; // [1, 2, 3, 4, 5, 6]
const clone = [...first]; // shallow copy — [1, 2, 3]
const withExtra = [0, ...first, 3.5, ...second, 7]; // [0, 1, 2, 3, 3.5, 4, 5, 6, 7]

// ── Spread in object literals (ES2018) ────────────────────────────────
const defaults = { theme: 'light', language: 'en', fontSize: 16 };
const userPrefs = { theme: 'dark', fontSize: 18 };

// Merge objects — later properties override earlier ones
const config = { ...defaults, ...userPrefs };
// { theme: 'dark', language: 'en', fontSize: 18 }

// Non-destructive update pattern:
const updatedConfig = { ...config, language: 'fr' };

// ── Spread converts iterables to arrays ───────────────────────────────
const letters = [...'hello']; // ['h', 'e', 'l', 'l', 'o']
const setToArray = [...new Set([1, 2, 2, 3, 3, 3])]; // [1, 2, 3]
```

## Enhanced Object Literals

```javascript
const name = 'Alice';
const age = 30;
const role = 'admin';

// ── Shorthand properties ───────────────────────────────────────────────
// Old: { name: name, age: age }
const user = { name, age, role }; // when key and variable name match

// ── Shorthand methods ─────────────────────────────────────────────────
const calculator = {
  value: 0,

  // Old: add: function(n) { ... }
  add(n) {
    this.value += n;
    return this;
  },

  subtract(n) {
    this.value -= n;
    return this;
  },

  result() {
    return this.value;
  },
};

// ── Computed property names ────────────────────────────────────────────
const prefix = 'get';
const fields = ['name', 'age', 'email'];

const getters = {};
fields.forEach((field) => {
  getters[`${prefix}${field[0].toUpperCase()}${field.slice(1)}`] = function () {
    return this[field];
  };
});
// → { getName: f, getAge: f, getEmail: f }

// Inline computed keys:
const key = 'dynamicKey';
const obj = {
  [key]: 'value', // property name from a variable
  [`${key}_extra`]: 'extra', // computed with template literal
  [Symbol('id')]: 123, // Symbol as property key
};
```

## Classes — Syntactic Sugar Over Prototypes

ES2015 classes provide a clean syntax for the prototype-based inheritance that JavaScript has always had.

```javascript
// ── Basic class ────────────────────────────────────────────────────────
class Animal {
  // Constructor: runs when new Animal() is called
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }

  // Instance method (lives on Animal.prototype)
  speak() {
    return `${this.name} says ${this.sound}`;
  }

  // Getter: access as a property, not a method call
  get description() {
    return `${this.name} (${this.sound})`;
  }

  // Static method: called on the class, not instances
  static create(name, sound) {
    return new Animal(name, sound);
  }
}

const dog = new Animal('Rex', 'woof');
console.log(dog.speak()); // 'Rex says woof'
console.log(dog.description); // 'Rex (woof)' — no () because it's a getter
const cat = Animal.create('Felix', 'meow');

// ── Inheritance with extends ───────────────────────────────────────────
class Dog extends Animal {
  constructor(name, breed) {
    super(name, 'woof'); // must call super() before using 'this'
    this.breed = breed;
  }

  // Override parent method
  speak() {
    return `${super.speak()} (excitedly)`; // call parent's method
  }

  fetch(item) {
    return `${this.name} fetches the ${item}!`;
  }
}

const rex = new Dog('Rex', 'German Shepherd');
console.log(rex instanceof Dog); // true
console.log(rex instanceof Animal); // true — rex is also an Animal
console.log(rex.speak()); // 'Rex says woof (excitedly)'

// ── Private fields (ES2022) ───────────────────────────────────────────
class BankAccount {
  #balance = 0; // truly private — no external access
  #transactions = [];

  deposit(amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.#balance += amount;
    this.#transactions.push({ type: 'deposit', amount });
  }

  get balance() {
    return this.#balance; // controlled read-only access
  }
}

const account = new BankAccount();
account.deposit(100);
console.log(account.balance); // 100
console.log(account.#balance); // SyntaxError — truly private ✅
```

:::note
JavaScript class syntax is not the same as classes in Java or C#. Under the hood, it's still prototype-based inheritance — `class` is syntactic sugar that makes the familiar prototype mechanism easier to write and understand. The behavior is identical to ES5 constructor functions and `Object.prototype`.
:::

## Modules — import and export

ES2015 introduced native module syntax, solving the fragmentation between CommonJS (Node.js `require`) and AMD (browser `define`).

```javascript
// ── math.js: named exports ────────────────────────────────────────────
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}
export function multiply(a, b) {
  return a * b;
}

// Export a class
export class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}

// ── Or: export at the end ─────────────────────────────────────────────
const subtract = (a, b) => a - b;
const divide = (a, b) => a / b;
export { subtract, divide };

// ── Default export: one per module ────────────────────────────────────
// utils.js
export default function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(date);
}

// ── Imports ───────────────────────────────────────────────────────────
// Named imports
import { PI, add, Vector } from './math.js';
import { subtract as minus } from './math.js'; // rename on import

// Default import (any name you choose)
import formatDate from './utils.js';
import myFormatter from './utils.js'; // same module, different local name

// Import all named exports as a namespace object
import * as MathUtils from './math.js';
MathUtils.add(1, 2); // 3
MathUtils.PI; // 3.14159

// Mix default and named
import formatDate, { PI, add } from './math-utils.js';

// Side-effect-only import (runs module but imports nothing)
import './polyfills.js';

// ── Dynamic imports (ES2020) ──────────────────────────────────────────
// Import at runtime — returns a Promise
async function loadHeavyModule() {
  const module = await import('./heavy-library.js');
  module.default.initialize();
}

// Conditional loading
if (needsFeature) {
  const { featureFunction } = await import('./feature.js');
  featureFunction();
}
```

:::tip
ES modules are **static** by default — the import/export statements are analyzed at parse time, not runtime. This enables tree-shaking (dead code elimination) in bundlers like webpack and Rollup. Dynamic `import()` is the exception — it loads modules at runtime and returns a Promise.
:::

## Promises — Taming Asynchronous Code

Promises represent a value that will be available in the future — success or failure.

```javascript
// ── Creating a Promise ─────────────────────────────────────────────────
const fetchUser = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: 'Alice', email: 'alice@example.com' });
      } else {
        reject(new Error('Invalid user ID'));
      }
    }, 1000);
  });

// ── Consuming Promises ─────────────────────────────────────────────────
fetchUser(1)
  .then((user) => {
    console.log('Got user:', user.name);
    return fetchUser(2); // chain — return a new Promise
  })
  .then((user2) => console.log('Got user 2:', user2.name))
  .catch((error) => console.error('Error:', error.message))
  .finally(() => console.log('Done — always runs'));

// ── Promise.all: run in parallel, wait for all ─────────────────────────
Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)])
  .then(([user1, user2, user3]) => console.log(user1, user2, user3))
  .catch((error) => console.error('One failed:', error)); // fails if ANY rejects

// ── Promise.allSettled: run in parallel, get all results ──────────────
Promise.allSettled([fetchUser(1), fetchUser(-1), fetchUser(3)]).then(
  (results) => {
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        console.log('Success:', result.value);
      } else {
        console.error('Failed:', result.reason);
      }
    });
  },
);

// ── Promise.race: first to settle wins ────────────────────────────────
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 5000),
);

Promise.race([fetchUser(1), timeout])
  .then((user) => console.log('Fast enough:', user))
  .catch((error) => console.error(error.message));

// ── Promise.any (ES2021): first to FULFILL wins ───────────────────────
Promise.any([fetchUser(-1), fetchUser(1), fetchUser(2)])
  .then((firstSuccess) => console.log('First success:', firstSuccess))
  .catch(() => console.log('All failed (AggregateError)'));
```

## Symbols — Guaranteed Unique Values

Symbols are a new primitive type. Every symbol is completely unique — no two symbols are ever equal, even if they have the same description.

```javascript
// ── Creating symbols ───────────────────────────────────────────────────
const id = Symbol('id');
const name = Symbol('id'); // same description
console.log(id === name); // false — symbols are always unique

// ── Symbols as object keys ─────────────────────────────────────────────
const ID = Symbol('id');
const user = {
  name: 'Alice',
  [ID]: 12345, // symbol key — not shown in for...in or Object.keys()
};

console.log(user[ID]); // 12345
console.log(Object.keys(user)); // ['name'] — ID is hidden
console.log(JSON.stringify(user)); // '{"name":"Alice"}' — symbol excluded

// ── Well-known symbols: customize built-in behavior ───────────────────
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  // Make Range iterable with Symbol.iterator
  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  }
}

for (const n of new Range(1, 5)) {
  console.log(n); // 1, 2, 3, 4, 5
}
const nums = [...new Range(1, 5)]; // [1, 2, 3, 4, 5] — works with spread!
```

## Iterators and Generators

Generators are functions that can pause execution and resume later, producing a sequence of values on demand.

```javascript
// ── Generator function: uses function* and yield ───────────────────────
function* countUp(start = 0) {
  while (true) {
    yield start++; // pauses here, returns start, then resumes on next call
  }
}

const counter = countUp(1);
console.log(counter.next()); // { value: 1, done: false }
console.log(counter.next()); // { value: 2, done: false }
console.log(counter.next()); // { value: 3, done: false }

// ── Finite generator ───────────────────────────────────────────────────
function* range(start, end, step = 1) {
  for (let i = start; i <= end; i += step) {
    yield i;
  }
}

console.log([...range(0, 10, 2)]); // [0, 2, 4, 6, 8, 10]

// ── Generators as infinite sequences ──────────────────────────────────
function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

function take(n, iterable) {
  const result = [];
  for (const value of iterable) {
    result.push(value);
    if (result.length >= n) break;
  }
  return result;
}

take(8, fibonacci()); // [0, 1, 1, 2, 3, 5, 8, 13]

// ── Async generators (ES2018) ─────────────────────────────────────────
async function* fetchPages(url) {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`${url}?page=${page}`);
    const data = await response.json();
    yield data.items;
    hasMore = data.hasNextPage;
    page++;
  }
}

for await (const items of fetchPages('/api/products')) {
  console.log('Loaded page of items:', items.length);
}
```

## Map and Set — New Collection Types

```javascript
// ── Map: key-value store where keys can be ANY type ───────────────────
const map = new Map();

// Keys can be objects, functions, primitives — anything
const keyObj = { id: 1 };
const keyFn = () => {};

map.set('string key', 'value1');
map.set(42, 'value2');
map.set(keyObj, 'value3');
map.set(keyFn, 'value4');

map.get(keyObj); // 'value3'
map.has(42); // true
map.delete(42);
map.size; // 3

// Iterate over Map entries
for (const [key, value] of map) {
  console.log(key, value);
}

// Map from array of pairs
const roles = new Map([
  ['alice', 'admin'],
  ['bob', 'editor'],
  ['carol', 'viewer'],
]);

// ── Set: collection of unique values ──────────────────────────────────
const set = new Set([1, 2, 3, 3, 2, 1]); // {1, 2, 3} — duplicates removed
set.add(4);
set.has(2); // true
set.delete(1);
set.size; // 3

// Most common use: deduplicate an array
const withDupes = [1, 2, 3, 2, 1, 4, 3, 5];
const unique = [...new Set(withDupes)]; // [1, 2, 3, 4, 5]

// ── WeakMap and WeakSet: hold references weakly ───────────────────────
// Objects in WeakMap/WeakSet can be garbage collected if no other references exist
// No size property, not iterable — designed specifically for private data
const privateData = new WeakMap();

class Person {
  constructor(name, age) {
    // Store private data keyed to 'this' instance
    privateData.set(this, { name, age });
  }

  get name() {
    return privateData.get(this).name;
  }
  get age() {
    return privateData.get(this).age;
  }
}
```

:::note
Use `Map` instead of plain objects when: keys are not strings/Symbols, you need to iterate in insertion order, you frequently add/delete keys, or you need to know the size. Plain objects are fine for simple key-value stores with known string keys.
:::

## Proxy and Reflect — Meta-Programming

`Proxy` wraps an object and intercepts operations on it. `Reflect` provides methods corresponding to every trap.

```javascript
// ── Basic Proxy: validation ────────────────────────────────────────────
const handler = {
  set(target, property, value) {
    if (property === 'age') {
      if (typeof value !== 'number')
        throw new TypeError('Age must be a number');
      if (value < 0 || value > 150) throw new RangeError('Age out of range');
    }
    // Reflect.set performs the default set operation
    return Reflect.set(target, property, value);
  },

  get(target, property) {
    if (!(property in target)) {
      throw new Error(`Property '${property}' does not exist`);
    }
    return Reflect.get(target, property);
  },
};

const user = new Proxy({}, handler);
user.name = 'Alice'; // ✅
user.age = 30; // ✅
user.age = -5; // ❌ RangeError: Age out of range
user.unknown; // ❌ Error: Property 'unknown' does not exist

// ── Proxy for reactive data (how Vue 3 works) ─────────────────────────
function reactive(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      const result = Reflect.set(obj, prop, value);
      if (oldValue !== value) {
        onChange(prop, oldValue, value);
      }
      return result;
    },
  });
}

const state = reactive({ count: 0, name: 'App' }, (prop, oldVal, newVal) => {
  console.log(`${prop} changed: ${oldVal} → ${newVal}`);
});

state.count = 1; // logs: 'count changed: 0 → 1'
state.name = 'My App'; // logs: 'name changed: App → My App'
```

## ES2016 (ES7) — Small but Important

## Array.prototype.includes

`includes` is cleaner than `indexOf !== -1` and correctly handles `NaN`.

```javascript
const fruits = ['apple', 'banana', 'cherry'];

// Old way: indexOf
fruits.indexOf('banana') !== -1; // true
fruits.indexOf('grape') !== -1; // false

// New way: includes
fruits.includes('banana'); // true
fruits.includes('grape'); // false

// KEY ADVANTAGE: handles NaN correctly
[1, 2, NaN].indexOf(NaN); // -1 — broken!
[1, 2, NaN].includes(NaN); // true ✅

// Second argument: start index
[1, 2, 3, 2, 1].includes(2, 3); // starts searching from index 3 → false
```

## Exponentiation Operator

```javascript
// Old way
Math.pow(2, 10); // 1024

// New way
2 ** 10; // 1024
3 ** 3; // 27
2 ** 32; // 4294967296

// Assignment shorthand
let base = 2;
base **= 8; // 256
```
