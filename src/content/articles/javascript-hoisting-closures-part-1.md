---
title: 'Hoisting and Closures in JavaScript - Part 1'
published: 2026-01-14
draft: false
description: 'Get to know about hoisting in the first part of this 3-part series about hoisting and closures and it will become your ally from your enemy.'
toc: true
series: 'hoisting & closures'
tags: ['hoisting', 'closures', 'javascript']
icons: ['javascript']
tech: 'js'
---

## What Is Hoisting

Hoisting is JavaScript's behavior of moving declarations to the top of their scope before the code executes. It's not a physical movement of your code — it's what happens during the **compilation phase**, before a single line of your program runs.

JavaScript has two phases when it processes your code:

```text
┌──────────────────────────────────────────────────────────────────────┐
│                  JAVASCRIPT'S TWO PHASES                             │
│                                                                      │
│  Phase 1: COMPILATION                                                │
│  ─────────────────────────────────────────────────────────           │
│  JavaScript scans your entire code.                                  │
│  It finds all var declarations, function declarations,               │
│  and registers them in memory — before running anything.             │
│                                                                      │
│  Phase 2: EXECUTION                                                  │
│  ─────────────────────────────────────────────────────────           │
│  JavaScript runs your code line by line.                             │
│  By now, declarations are already known.                             │
│  Assignments still happen in order, top to bottom.                   │
└──────────────────────────────────────────────────────────────────────┘
```

This two-phase process is why you can call a function before it appears in your file, or why accessing a `var` variable before its line doesn't throw an error (though it gives you `undefined`).

:::note
The term "hoisting" is actually a mental model, not a literal process. Your code isn't rewritten. The JavaScript engine simply scans and registers declarations in memory during compilation, giving the illusion that they've been "moved" to the top.
:::

## How var Is Hoisted

Variables declared with `var` are hoisted to the top of their **function scope** (or global scope if declared at the top level). The declaration is hoisted, but the assignment is not.

```javascript
// What you write:
console.log(name); // What happens here?
var name = 'Alice';
console.log(name);

// What JavaScript actually sees (mental model):
var name; // declaration is hoisted, initialized to undefined
console.log(name); // undefined  ← NOT an error, NOT 'Alice'
name = 'Alice'; // assignment stays in place
console.log(name); // 'Alice'
```

This is one of the most common sources of bugs in JavaScript. The variable exists but has no value yet.

```javascript
// A more dangerous example — loop variable leaking
function processItems() {
  for (var i = 0; i < 5; i++) {
    // do something
  }
  console.log(i); // 5 — i is still accessible! var is function-scoped
}

// var leaks out of if blocks too
if (true) {
  var secretMessage = 'hello';
}
console.log(secretMessage); // 'hello' — NOT a ReferenceError!

// Compare with let (block-scoped):
if (true) {
  let blockMessage = 'hello';
}
console.log(blockMessage); // ReferenceError: blockMessage is not defined ✅
```

:::warning
`var` hoisting has caused countless bugs throughout JavaScript's history. The variable existing (as `undefined`) before its declaration line makes code hard to reason about. This is exactly why `let` and `const` were introduced in ES6. **In modern JavaScript, you should almost never use `var`.**
:::

## How Function Declarations Are Hoisted

Function declarations are hoisted **completely** — both the declaration AND the body. This means you can call a function before it appears in your code, and it works perfectly.

```javascript
// Calling a function before it's defined — works fine!
greet('Alice'); // 'Hello, Alice!'

function greet(name) {
  console.log(`Hello, ${name}!`);
}

// JavaScript sees this during compilation:
// → function greet is stored in memory with its full body
// → then the greet('Alice') call runs and finds the function
```

This is actually a feature, not a bug. It lets you organize your code so the important high-level functions appear at the top and the implementation details are lower down — even though the helpers are called by the top-level code.

```javascript
// You can organize code for readability — high level first
function runApplication() {
  const users = loadUsers(); // defined later in the file
  const filtered = filterActive(users); // defined later in the file
  display(filtered); // defined later in the file
}

runApplication(); // This works perfectly

// ─────────── Helper functions below ───────────

function loadUsers() {
  return [
    { name: 'Alice', active: true },
    { name: 'Bob', active: false },
    { name: 'Carol', active: true },
  ];
}

function filterActive(users) {
  return users.filter((user) => user.active);
}

function display(items) {
  items.forEach((item) => console.log(item.name));
}
```

:::tip
Because function declarations are fully hoisted, many developers use this to their advantage — writing the main logic at the top of a file and the helper functions below it. This makes the file read like a newspaper: the important stuff first, details later.
:::

## Function Expressions Are NOT Fully Hoisted

This is where many developers get caught out. There's a crucial difference between function **declarations** and function **expressions**.

```javascript
// ── Function Declaration ──────────────────────────────────────────────
// Declaration: hoisted completely. Can be called before the line.
console.log(add(2, 3)); // 5 ✅

function add(a, b) {
  return a + b;
}

// ── Function Expression ───────────────────────────────────────────────
// Expression assigned to var: the VAR is hoisted (as undefined), not the function
console.log(multiply(2, 3)); // TypeError: multiply is not a function ❌
// Why? multiply is hoisted as 'undefined', and undefined is not callable

var multiply = function (a, b) {
  return a * b;
};

// ── Arrow Function Expression ──────────────────────────────────────────
// Same behavior as function expression
console.log(divide(10, 2)); // ReferenceError: Cannot access 'divide' before init ❌

const divide = (a, b) => a / b;
```

The different error messages are telling:

- `TypeError: multiply is not a function` — `var multiply` was hoisted as `undefined`, and you tried to call `undefined()`.
- `ReferenceError: Cannot access 'divide' before initialization` — `const divide` was hoisted but put in the Temporal Dead Zone (explained next).

:::warning
The difference in error messages is a subtle clue about what's happening under the hood. `var` gets hoisted and initialized to `undefined`. `let` and `const` get hoisted but are NOT initialized — accessing them before their line throws a `ReferenceError`. This is intentional and safer.
:::

## let and const — Hoisted but Not Initialized (The Temporal Dead Zone)

`let` and `const` ARE hoisted — they are registered during the compilation phase just like `var`. The crucial difference: they are placed in the **Temporal Dead Zone (TDZ)** until their declaration line is reached.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                  THE TEMPORAL DEAD ZONE (TDZ)                        │
│                                                                      │
│  Start of scope                                                      │
│  ───────────────                                                     │
│  │                                                                   │
│  │  ← TDZ for 'username' begins here                                 │
│  │    (variable is registered but accessing it throws ReferenceError)│
│  │                                                                   │
│  │  console.log(username); // ❌ ReferenceError                      │
│  │                                                                   │
│  │  let username = 'Alice'; // ← TDZ ENDS here. Variable is init'd  │
│  │                                                                   │
│  │  console.log(username); // ✅ 'Alice'                             │
│  │                                                                   │
│  End of scope                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

```javascript
// TDZ in action
function example() {
  // TDZ for 'city' starts here
  console.log(typeof city); // ReferenceError (NOT 'undefined' like with var)

  let city = 'London'; // TDZ ends here
  console.log(city); // 'London'
}

// Contrast with var — no TDZ
function exampleVar() {
  console.log(typeof country); // 'undefined' (no error — var has no TDZ)
  var country = 'UK';
  console.log(country); // 'UK'
}

// The TDZ applies even in the same block
let value = 10;

function tricky() {
  // 'value' is hoisted to the TOP of this function scope (TDZ begins)
  // The outer 'value = 10' is NOT accessible here
  console.log(value); // ReferenceError — in TDZ!
  let value = 20; // TDZ ends here
  console.log(value); // 20
}

tricky();
```

:::note
The Temporal Dead Zone is one of the best features `let` and `const` brought to JavaScript. It eliminates the confusing "why is this `undefined`?" bugs from `var` and replaces them with clear, immediate `ReferenceError`s. Errors that are loud and obvious are better than bugs that are silent and confusing.
:::

## Hoisting With Classes

Class declarations are hoisted like `let` and `const` — they exist in the TDZ until their declaration line.

```javascript
// Function declarations: fully hoisted ✅
const cat = new Animal('Felix'); // Works!
function Animal(name) {
  this.name = name;
}

// Class declarations: hoisted but in TDZ ❌
const dog = new Dog('Rex'); // ReferenceError: Cannot access 'Dog' before initialization

class Dog {
  constructor(name) {
    this.name = name;
  }
}

// Class expressions: same as function expressions — variable is hoisted, class is not
const tiger = new BigCat('Simba'); // TypeError: BigCat is not a constructor

const BigCat = class {
  constructor(name) {
    this.name = name;
  }
};
```

:::tip
The fact that classes are NOT fully hoisted (unlike function declarations) encourages good code organization. Define your classes before you use them. This makes the codebase more readable and prevents the "magic" of hoisting from obscuring the program's structure.
:::

## Hoisting Order — When Multiple Things Are Declared

When multiple declarations exist in the same scope, they're processed in a specific order:

```javascript
// Demonstration of hoisting order

console.log(typeof greet); // 'function' (not 'undefined')

// Function declarations win over var declarations with the same name
var greet = 'hello string'; // ← this var declaration is IGNORED during hoisting
//   because a function declaration with same name already exists

function greet() {
  // ← this WINS during compilation
  return 'hello function';
}

console.log(typeof greet); // 'string' — the assignment DID run, overwriting the function
```

```javascript
// More explicit demonstration
// Step 1 (compilation): function declarations are hoisted first
// Step 2 (compilation): var declarations follow (but don't overwrite functions)
// Step 3 (execution): assignments run top to bottom

var score = 100; // assignment runs: score becomes 100
console.log(score); // 100

function score() {
  // this function is hoisted BEFORE score = 100 runs
  return 'I am a function';
}

// During compilation:
// 1. function score() is registered
// 2. var score is processed — but since score is already a function, the var declaration is skipped
// 3. Execution begins: score = 100 runs (assignment overwrites the function reference)
```

:::warning
Having a variable and a function with the same name in the same scope is a recipe for confusion. JavaScript will silently prioritize one over the other during hoisting and then potentially overwrite it during execution. Never do this intentionally — use distinct, descriptive names.
:::
