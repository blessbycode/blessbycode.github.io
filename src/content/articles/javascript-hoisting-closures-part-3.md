---
title: 'Hoisting and Closures in JavaScript - Part 3'
published: 2026-01-16
draft: false
description: 'Check your understanding in this last part of 3-part series about hoisting and closures and be ready to brag about it.'
toc: true
series: 'hoisting & closures'
tags: ['hoisting', 'closures', 'javascript']
icons: ['javascript']
tech: 'js'
---

## How Hoisting and Closures Work Together

These two concepts combine in powerful and sometimes surprising ways.

```javascript
// Function declarations inside closures are hoisted within that closure's scope
function outer() {
  // We can call 'inner' before it appears — it's hoisted within outer()
  console.log(inner()); // 'I am hoisted inside outer!'

  function inner() {
    return 'I am hoisted inside outer!';
  }
}

outer();

// ───────────────────────────────────────────────

// Closures capture the REFERENCE, not the VALUE (at time of creation)
// This matters with var but not with let/const for loops (as we saw earlier)

function createFunctions() {
  const functions = [];

  for (let i = 0; i < 3; i++) {
    // Each function declaration is hoisted within its block (let creates a new scope)
    functions.push(function captured() {
      return i; // captures the block-scoped i — each iteration has its own
    });
  }

  return functions;
}

const [fn0, fn1, fn2] = createFunctions();
console.log(fn0()); // 0
console.log(fn1()); // 1
console.log(fn2()); // 2

// ───────────────────────────────────────────────

// Closures and hoisting with class methods
function createAnimal(name, sound) {
  // These function declarations are hoisted within createAnimal
  function describe() {
    // 'name' is closed over from createAnimal's scope
    return `I am ${name}`;
  }

  function speak() {
    // 'sound' is also closed over
    return `${name} says ${sound}`;
  }

  // Can call describe() and speak() before they appear because they're hoisted
  console.log(describe()); // works!
  console.log(speak()); // works!

  return { describe, speak };
}

const dog = createAnimal('Rex', 'woof');
console.log(dog.describe()); // 'I am Rex'
console.log(dog.speak()); // 'Rex says woof'
```

## Common Interview Questions Decoded

These come up constantly in JavaScript interviews. Now you can answer them with confidence.

```javascript
// ── Q1: What does this output? ─────────────────────────────────────────
console.log(a); // undefined (var is hoisted, initialized to undefined)
var a = 5;
console.log(a); // 5

// ── Q2: What about this? ───────────────────────────────────────────────
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 5; // (b is in the TDZ — hoisted but not yet initialized)

// ── Q3: Function declaration vs expression ─────────────────────────────
foo(); // 'foo called!' — function declaration is fully hoisted
bar(); // TypeError: bar is not a function — var bar is undefined (hoisted as undefined)

function foo() {
  console.log('foo called!');
}
var bar = function () {
  console.log('bar called!');
};

// ── Q4: The classic closure interview question ──────────────────────────
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 0);
}
// Output: 3, 3, 3 (NOT 0, 1, 2)
// Why? All three functions close over the SAME var i, which is 3 after the loop

// Fix with let:
for (let i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 0);
}
// Output: 0, 1, 2 ✅

// ── Q5: What is the output? ────────────────────────────────────────────
function outer() {
  var x = 10;

  function inner() {
    var x = 20; // NEW x in inner's scope — doesn't affect outer's x
    console.log(x); // 20
  }

  inner();
  console.log(x); // 10 — outer's x is unchanged
}

outer();
// Output: 20, then 10

// ── Q6: Predict the output of this hoisting example ────────────────────
function example() {
  console.log(typeof x); // 'function' — function declaration takes precedence
  console.log(x()); // 'I am x'

  var x = 10; // this declaration is overridden by the function during hoisting

  function x() {
    // function declaration hoisted, wins over var x
    return 'I am x';
  }

  console.log(typeof x); // 'number' — assignment ran: x = 10 overwrote the function
  console.log(x); // 10
}
example();
```

## Quick Reference — Everything in One Place

```text
┌──────────────────────────────────────────────────────────────────────┐
│                    HOISTING REFERENCE                                │
│                                                                      │
│  var           Hoisted to function scope, initialized to undefined   │
│  let / const   Hoisted to block scope, IN TDZ until declaration      │
│                (ReferenceError if accessed before declaration)        │
│  function      Hoisted completely (declaration + body) ✅            │
│  declaration   Can be called before the line it's written on         │
│  function      Variable hoisted (var→undefined, let/const→TDZ),     │
│  expression    but the function body is NOT hoisted                  │
│  class         Hoisted but in TDZ — cannot be used before declaration│
│                                                                      │
│                    CLOSURE REFERENCE                                 │
│                                                                      │
│  Definition    A function that remembers the variables from          │
│                the scope where it was CREATED                        │
│  Key insight   The scope chain is LEXICAL (determined by where        │
│                code is written, not where it's called from)          │
│  Captures      References to variables (not copies of values)        │
│  Common uses   Data privacy, factory functions, memoization,         │
│                event handlers, partial application, currying,         │
│                module pattern                                        │
│  Watch out     Memory leaks from keeping large values in closures;   │
│                loop bugs when using var (use let instead)            │
└──────────────────────────────────────────────────────────────────────┘
```

:::note
Hoisting and closures aren't quirks or bugs in JavaScript — they're deliberate features that, once understood, become tools. Hoisting enables organizing code for readability. Closures enable privacy, persistence, and powerful function composition. Every experienced JavaScript developer has a solid mental model of both. Now you do too.
:::
