---
title: 'Hoisting and Closures in JavaScript - Part 2'
published: 2026-01-15
draft: false
description: 'Understand and master closures in this second part of 3-part series about hoisting and closures and be ready to ace your next project.'
toc: true
series: 'hoisting & closures'
tags: ['hoisting', 'closures', 'javascript']
icons: ['javascript']
tech: 'js'
---

## What Is a Closure

A closure is a function that **remembers the variables from the place where it was created** — even after that outer function has finished executing and returned.

In other words: a function carries its surrounding scope with it like a backpack. Wherever the function goes, it can still access the variables from that backpack.

```text
┌──────────────────────────────────────────────────────────────────────┐
│                   WHAT A CLOSURE LOOKS LIKE                          │
│                                                                      │
│  function outer() {                                                  │
│    let message = 'Hello';   ← this variable                         │
│                                                                      │
│    function inner() {                                                │
│      console.log(message);  ← is accessible here (closure)          │
│    }                                                                 │
│                                                                      │
│    return inner;            ← inner is returned, carrying message    │
│  }                                                                   │
│                                                                      │
│  const sayHello = outer();  ← outer() has FINISHED EXECUTING        │
│                               but message is still alive in memory  │
│                                                                      │
│  sayHello(); // 'Hello'     ← message is still accessible!          │
│                                                                      │
│  The inner function CLOSED OVER the message variable.                │
│  That's what a closure is.                                           │
└──────────────────────────────────────────────────────────────────────┘
```

```javascript
function createGreeting(greeting) {
  // 'greeting' lives in the scope of createGreeting

  return function(name) {
    // This inner function closes over 'greeting'
    // Even after createGreeting finishes, 'greeting' is remembered
    return `${greeting}, ${name}!`;
  };
}

const sayHello = createGreeting('Hello');
const sayHowdy = createGreeting('Howdy');
const sayBonjour = createGreeting('Bonjour');

// createGreeting has finished executing — but each returned function
// remembers its own 'greeting' value
console.log(sayHello('Alice'));   // 'Hello, Alice!'
console.log(sayHowdy('Bob');      // 'Howdy, Bob!'
console.log(sayBonjour('Carol')); // 'Bonjour, Carol!'
```

Each call to `createGreeting` creates a new closure — a new function with its own independent memory of `greeting`.

## The Scope Chain — The Foundation Closures Are Built On

To truly understand closures, you need to understand how JavaScript looks up variables. When a function references a variable, JavaScript searches for it in a specific order:

```text
┌──────────────────────────────────────────────────────────────────────┐
│                    THE SCOPE CHAIN                                   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  Global Scope                                              │      │
│  │  globalVar = 'I am global'                                │      │
│  │                                                            │      │
│  │  ┌─────────────────────────────────────────────────┐      │      │
│  │  │  Outer Function Scope                           │      │      │
│  │  │  outerVar = 'I am outer'                        │      │      │
│  │  │                                                 │      │      │
│  │  │  ┌───────────────────────────────────────┐     │      │      │
│  │  │  │  Inner Function Scope                 │     │      │      │
│  │  │  │  innerVar = 'I am inner'              │     │      │      │
│  │  │  │                                       │     │      │      │
│  │  │  │  console.log(innerVar);  // looks here first │      │      │
│  │  │  │  console.log(outerVar);  // not found → go up│      │      │
│  │  │  │  console.log(globalVar); // go up again      │      │      │
│  │  │  └───────────────────────────────────────┘     │      │      │
│  │  └─────────────────────────────────────────────────┘      │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                      │
│  Variables are found by searching UP the chain.                      │
│  A closure is what lets an inner function search through             │
│  scopes that technically "no longer exist" after a function returns. │
└──────────────────────────────────────────────────────────────────────┘
```

```javascript
const globalLevel = 'global';

function level1() {
  const firstLevel = 'level 1';

  function level2() {
    const secondLevel = 'level 2';

    function level3() {
      const thirdLevel = 'level 3';

      // Can access ALL variables in the scope chain
      console.log(thirdLevel); // 'level 3'   — own scope
      console.log(secondLevel); // 'level 2'   — parent scope (closure)
      console.log(firstLevel); // 'level 1'   — grandparent scope (closure)
      console.log(globalLevel); // 'global'    — global scope
    }

    level3();
  }

  level2();
}

level1();
```

:::note
JavaScript's scope chain is **lexical** — it's determined by where functions are physically written in the source code, not by where or how they're called. A function always has access to the scope it was written in, regardless of where it ends up being called from. This is the key insight behind closures.
:::

## Practical Closure: Data Privacy and Encapsulation

One of the most powerful uses of closures is creating private state — variables that can't be accessed or modified directly from outside a function.

```javascript
// Without closures: all state is public and unprotected
let bankBalance = 1000; // anyone can do bankBalance = 0 or bankBalance = 9999999

// With closures: state is private, only accessible through controlled functions
function createBankAccount(initialBalance) {
  // 'balance' is private — completely inaccessible from outside this function
  let balance = initialBalance;
  // transaction history — also private
  const history = [];

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error('Deposit must be positive');
      balance += amount;
      history.push({ type: 'deposit', amount, balance });
      return `Deposited $${amount}. Balance: $${balance}`;
    },

    withdraw(amount) {
      if (amount <= 0) throw new Error('Withdrawal must be positive');
      if (amount > balance) throw new Error('Insufficient funds');
      balance -= amount;
      history.push({ type: 'withdrawal', amount, balance });
      return `Withdrew $${amount}. Balance: $${balance}`;
    },

    getBalance() {
      // Controlled read access — returns the value, not a reference
      return balance;
    },

    getHistory() {
      // Returns a COPY so callers can't mutate our private history
      return [...history];
    },
  };
}

const account = createBankAccount(1000);

console.log(account.getBalance()); // 1000
console.log(account.deposit(500)); // 'Deposited $500. Balance: $1500'
console.log(account.withdraw(200)); // 'Withdrew $200. Balance: $1300'

// These attempts to access private state FAIL (which is what we want):
console.log(account.balance); // undefined — balance is NOT a property of the returned object
console.log(account.history); // undefined — history is NOT exposed
account.balance = 1000000; // this creates a new property but doesn't change the internal balance
console.log(account.getBalance()); // still 1300 — internal balance is untouched ✅
```

:::tip
This pattern — using closures to create private state — is called the **Module Pattern**. It was the primary way JavaScript developers created encapsulated modules before ES6 modules (`import`/`export`) existed. Understanding it helps you understand both legacy codebases and the design of modern language features.
:::

## Closures and Loops — The Classic Gotcha

The most infamous closure bug in JavaScript: the `var` inside a loop. This trips up almost every developer at least once.

```javascript
// ❌ The broken version — what most beginners expect to work
const buttons = [];

for (var i = 0; i < 5; i++) {
  buttons.push(function () {
    console.log('Button', i, 'clicked');
  });
}

// Later, when buttons are clicked:
buttons[0](); // 'Button 5 clicked' — WRONG! Expected 'Button 0 clicked'
buttons[1](); // 'Button 5 clicked' — WRONG!
buttons[4](); // 'Button 5 clicked' — WRONG!

// WHY? All 5 functions close over the SAME 'i' variable
// (var is function-scoped, so there's only ONE 'i' in existence)
// By the time ANY button is clicked, the loop has finished and i = 5
// All 5 closures are looking at the same i, which is now 5
```

```text
┌──────────────────────────────────────────────────────────────────────┐
│                   WHY THE LOOP CLOSURE BUG HAPPENS                   │
│                                                                      │
│  With var:                                                           │
│  ┌─────────────────────────────────────────────────┐                │
│  │  ONE 'i' variable shared by ALL closures         │                │
│  │  After loop: i = 5                               │                │
│  │  fn[0] → looks up i → finds 5                   │                │
│  │  fn[1] → looks up i → finds 5                   │                │
│  │  fn[2] → looks up i → finds 5                   │                │
│  └─────────────────────────────────────────────────┘                │
│                                                                      │
│  With let:                                                           │
│  ┌─────────────────────────────────────────────────┐                │
│  │  SEPARATE 'i' for EACH iteration                 │                │
│  │  fn[0] → looks up i → finds 0 (its own copy)   │                │
│  │  fn[1] → looks up i → finds 1 (its own copy)   │                │
│  │  fn[2] → looks up i → finds 2 (its own copy)   │                │
│  └─────────────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────────────┘
```

```javascript
// ✅ Fix 1: Use let instead of var (simplest and best solution)
const buttons = [];

for (let i = 0; i < 5; i++) {
  // 'let' creates a NEW binding for i on EVERY iteration
  // Each function closes over its own independent copy of i
  buttons.push(function () {
    console.log('Button', i, 'clicked');
  });
}

buttons[0](); // 'Button 0 clicked' ✅
buttons[1](); // 'Button 1 clicked' ✅
buttons[4](); // 'Button 4 clicked' ✅

// ✅ Fix 2: IIFE (Immediately Invoked Function Expression) — the pre-ES6 solution
// Each IIFE creates its own scope, capturing the current value of i
const buttons2 = [];

for (var i = 0; i < 5; i++) {
  buttons2.push(
    (function (capturedI) {
      // capturedI is a NEW variable in a NEW scope for each iteration
      return function () {
        console.log('Button', capturedI, 'clicked');
      };
    })(i),
  ); // immediately call the function, passing current i
}

buttons2[0](); // 'Button 0 clicked' ✅
buttons2[2](); // 'Button 2 clicked' ✅

// ✅ Fix 3: forEach (naturally creates a new scope per iteration)
[0, 1, 2, 3, 4].forEach(function (i) {
  buttons.push(function () {
    console.log('Button', i, 'clicked');
  });
});
```

:::warning
This loop bug appears in many real-world scenarios: event listeners added in a loop, `setTimeout` inside a loop, async callbacks inside a loop. The pattern is always the same — a closure over a `var` in a loop captures the _reference_ to the variable, not its value at that moment. The fix is always the same too: use `let`, use an IIFE, or restructure using array methods.
:::

## Closures in Event Listeners

Closures are everywhere in browser event handling. Every time you write an event listener, you're creating a closure.

```javascript
function setupButton(buttonId, message) {
  const button = document.getElementById(buttonId);
  let clickCount = 0;

  button.addEventListener('click', function () {
    // This handler is a closure over:
    // - 'message' (from setupButton's parameter)
    // - 'clickCount' (from setupButton's local variable)
    // - 'button' (from setupButton's local variable)

    clickCount++;
    console.log(`${message} (clicked ${clickCount} times)`);

    if (clickCount >= 5) {
      // Even button is accessible from inside the closure
      button.disabled = true;
      console.log('Button disabled after 5 clicks');
    }
  });
}

// Each call creates independent closures with separate clickCount values
setupButton('submit-btn', 'Form submitted!');
setupButton('cancel-btn', 'Action cancelled!');

// The submit button and cancel button have completely separate click counts
```

```javascript
// Real-world example: debounce function (closures powering performance optimization)
function debounce(func, delay) {
  // 'timeoutId' lives here, closed over by the returned function
  let timeoutId;

  return function (...args) {
    // Cancel the previous timeout if this function is called again before delay
    clearTimeout(timeoutId);

    // Create a new timeout
    timeoutId = setTimeout(() => {
      // 'func' and 'args' are also closed over from the outer scope
      func.apply(this, args);
    }, delay);
  };
}

// Usage:
const handleSearch = debounce(function (query) {
  console.log('Searching for:', query);
  // fetch(`/api/search?q=${query}`)...
}, 500);

// User types quickly — only the final keystroke triggers the search
document.getElementById('search').addEventListener('input', (e) => {
  handleSearch(e.target.value);
});
// Even after debounce() has returned, each debounced function
// maintains its own private 'timeoutId' through a closure
```

## Closures and Memoization — Caching with Closures

Closures are perfect for building caches because they can maintain private state between calls.

```javascript
// Memoize: cache the result of expensive function calls
function memoize(expensiveFunction) {
  // 'cache' is private to this memoized function — not accessible from outside
  const cache = new Map();

  return function (...args) {
    // Create a cache key from the arguments
    const key = JSON.stringify(args);

    // If we've computed this before, return the cached result immediately
    if (cache.has(key)) {
      console.log(`Cache hit for ${key}`);
      return cache.get(key);
    }

    // First time seeing these arguments — compute the result
    console.log(`Computing for ${key}...`);
    const result = expensiveFunction(...args);

    // Store in cache for next time
    cache.set(key, result);
    return result;
  };
}

// Simulate an expensive calculation
function slowFibonacci(n) {
  if (n <= 1) return n;
  return slowFibonacci(n - 1) + slowFibonacci(n - 2); // Very slow without memoization
}

const fastFibonacci = memoize(slowFibonacci);

console.log(fastFibonacci(40)); // Computing... takes a moment
console.log(fastFibonacci(40)); // Cache hit! Instant
console.log(fastFibonacci(40)); // Cache hit! Instant
```

## Closures and Factory Functions

Factory functions use closures to create objects with private state and privileged methods.

```javascript
function createCounter(initialValue = 0, step = 1) {
  // Private state — not accessible from outside
  let count = initialValue;
  const stepSize = step;
  const history = [initialValue];

  // Return an object whose methods are closures over the private state
  return {
    increment() {
      count += stepSize;
      history.push(count);
      return count;
    },

    decrement() {
      count -= stepSize;
      history.push(count);
      return count;
    },

    reset() {
      count = initialValue;
      history.push(count);
      return count;
    },

    getValue() {
      return count;
    },

    getHistory() {
      return [...history]; // Return a copy — caller can't mutate internal history
    },
  };
}

// Two completely independent counters — each has its own private state
const counterA = createCounter(0, 1);
const counterB = createCounter(100, 10);

counterA.increment(); // 1
counterA.increment(); // 2
counterB.decrement(); // 90

console.log(counterA.getValue()); // 2
console.log(counterB.getValue()); // 90
console.log(counterA.getHistory()); // [0, 1, 2]

// Private state is completely safe from external modification
counterA.count = 9999; // creates a new property on the returned object — has NO effect
console.log(counterA.getValue()); // still 2 ✅
```

## Closures and Partial Application / Currying

Closures make it easy to create specialized versions of functions by pre-filling some arguments.

```javascript
// Partial application: pre-fill some arguments
function multiply(a, b) {
  return a * b;
}

function partial(fn, ...presetArgs) {
  // 'fn' and 'presetArgs' are closed over by the returned function
  return function (...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

const double = partial(multiply, 2); // multiply with a=2 pre-filled
const triple = partial(multiply, 3); // multiply with a=3 pre-filled
const quadruple = partial(multiply, 4); // multiply with a=4 pre-filled

console.log(double(5)); // 10
console.log(triple(5)); // 15
console.log(quadruple(5)); // 20

// Currying: transform a multi-argument function into a chain of single-argument functions
function curry(fn) {
  return function curried(...args) {
    // If we have all the arguments needed, call the function
    if (args.length >= fn.length) {
      return fn(...args);
    }
    // Otherwise, return a new function that remembers the args so far
    return function (...moreArgs) {
      return curried(...args, ...moreArgs);
    };
  };
}

const curriedAdd = curry((a, b, c) => a + b + c);

const add5 = curriedAdd(5); // returns function waiting for b and c
const add5and3 = add5(3); // returns function waiting for c
console.log(add5and3(2)); // 10 — finally has all 3 args, computes 5+3+2

// Or call all at once:
console.log(curriedAdd(1)(2)(3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1, 2, 3)); // 6
```

## Memory and Closures — When to Be Careful

Closures keep variables alive in memory as long as the closure function itself is alive. This is by design — but it means closures can cause **memory leaks** if you're not careful.

```javascript
// ⚠️ Potential memory leak: holding large data in a closure longer than needed
function processLargeDataset() {
  // Imagine this is 100MB of data
  const hugeArray = new Array(1000000).fill({ data: 'lots of data...' });

  // The returned function closes over hugeArray
  // hugeArray stays in memory as long as this function exists
  return function getFirst() {
    return hugeArray[0]; // Only uses the first element!
  };
}

const getFirst = processLargeDataset();
// hugeArray (100MB) is now stuck in memory forever
// because getFirst holds a reference to it through a closure

// ✅ Fix: Only close over what you actually need
function processLargeDatasetBetter() {
  const hugeArray = new Array(1000000).fill({ data: 'lots of data...' });

  // Extract only what we need before returning
  const firstItem = hugeArray[0]; // pull out just the first item

  // hugeArray is no longer referenced — it can be garbage collected
  return function getFirst() {
    return firstItem; // close over just the small value
  };
}

// ── When closure-related memory leaks commonly happen ──────────────────

// DOM event listeners that are never removed
function setupWidget() {
  const expensiveData = loadLotsOfData(); // large object

  const button = document.getElementById('btn');

  // This listener closes over expensiveData
  // If the button is removed from the DOM but the listener is not cleaned up,
  // expensiveData can never be garbage collected
  button.addEventListener('click', function () {
    console.log(expensiveData.summary);
  });
}

// ✅ Fix: Remove event listeners when they're no longer needed
function setupWidgetClean() {
  const expensiveData = loadLotsOfData();

  const button = document.getElementById('btn');

  function handleClick() {
    console.log(expensiveData.summary);
  }

  button.addEventListener('click', handleClick);

  // Return a cleanup function — call this when the widget is destroyed
  return function cleanup() {
    button.removeEventListener('click', handleClick);
    // Now handleClick is removed, the closure is gone,
    // and expensiveData can be garbage collected
  };
}

const cleanupWidget = setupWidgetClean();
// ... later, when widget is removed from page:
cleanupWidget();
```

:::warning
Memory leaks from closures are subtle and don't cause immediate errors. They cause gradual memory growth that eventually slows down or crashes the application. In long-running single-page applications, this is a real problem. Be especially careful with closures inside event listeners, `setInterval` callbacks, and WebSocket handlers — these all hold onto their closed-over variables for a long time.
:::
