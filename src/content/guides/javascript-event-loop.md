---
title: 'JavaScript Event Loop: The Scariest Merry-Go-Round'
published: 2026-01-27
draft: false
description: "If you've ever wondered why `setTimeout(fn, 0)` doesn't always run immediately, why `async/await` feels like magic, or why JavaScript can handle thousands of operations without freezing — this article answers all of it. By the end, you'll have a mental model of the event loop so solid you can predict exactly how any piece of JavaScript will execute."
toc: true
tags: ['javascript', 'event loop']
icons: ['javascript']
tech: 'js'
---

## JavaScript Is Single-Threaded — And That's Actually Fine

Before we even touch the event loop, we need to demolish a common misconception.

**JavaScript runs on a single thread.** This means it can only do one thing at a time. There is no parallel execution, no multiple CPU cores churning through your code simultaneously (at least, not in the main thread).

If you come from a language like Java or C++, this probably sounds like a huge limitation. And yet JavaScript powers real-time chat apps, live dashboards, video streaming platforms, and multiplayer games. How?

The answer is the **event loop** — a clever mechanism that makes a single thread _feel_ like it's doing many things at once by being incredibly smart about how it manages time.

```text
┌─────────────────────────────────────────────────────────────────────┐
│           THE MYTH vs. THE REALITY                                  │
│                                                                     │
│  ❌ MYTH:    "JavaScript is slow because it's single-threaded"      │
│                                                                     │
│  ✅ REALITY: JavaScript's single thread + event loop lets it        │
│             handle thousands of concurrent operations by never      │
│             sitting idle — it delegates waiting to the environment  │
│             and moves on to the next thing immediately.             │
└─────────────────────────────────────────────────────────────────────┘
```

## The Problem the Event Loop Solves

Imagine you run a coffee shop — but you're the only barista.

**The bad approach (blocking):** A customer orders a latte. You start making it, and you stand there staring at the espresso machine for 3 minutes waiting for it to brew. The entire line of customers waits. Nobody gets served. The shop is frozen.

**The smart approach (non-blocking):** A customer orders a latte. You start the espresso machine, then immediately turn to the next customer and take their order. When the machine beeps, you come back, finish the latte, and serve it. The shop keeps moving.

JavaScript uses the smart approach. When it encounters something slow — fetching data from a server, reading a file, waiting for a timer — it doesn't stand there waiting. It hands the task off to the browser (or Node.js), says "let me know when you're done," and immediately moves on to the next piece of code.

The event loop is the mechanism that checks: "Hey, is anything done yet? Let me run whatever needs to run next."

## The Key Players — Meet the Cast

The event loop doesn't work alone. It's part of a larger system. Let's meet everyone involved.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                     THE JAVASCRIPT RUNTIME ENVIRONMENT                        │
│                                                                              │
│   ┌──────────────────────────┐                                               │
│   │      CALL STACK          │   JavaScript's to-do list.                   │
│   │  ┌────────────────────┐  │   Code executes here, one frame at a time.   │
│   │  │ getCurrentUser()   │  │                                               │
│   │  ├────────────────────┤  │                                               │
│   │  │ loadDashboard()    │  │                                               │
│   │  ├────────────────────┤  │                                               │
│   │  │ main()             │  │                                               │
│   │  └────────────────────┘  │                                               │
│   └──────────────────────────┘                                               │
│                                                                              │
│   ┌──────────────────────────┐   ┌────────────────────────────────────────┐  │
│   │    WEB APIs / Node APIs   │   │           CALLBACK QUEUE               │  │
│   │                          │   │    (also called "Task Queue" or         │  │
│   │  setTimeout              │   │     "Macrotask Queue")                  │  │
│   │  fetch / XHR             │   │                                         │  │
│   │  DOM events              │   │  [ clickHandler, timerCallback, ... ]   │  │
│   │  File I/O (Node)         │   └────────────────────────────────────────┘  │
│   │  setInterval             │                                               │
│   └──────────────────────────┘   ┌────────────────────────────────────────┐  │
│                                   │         MICROTASK QUEUE                │  │
│   ┌──────────────────────────┐   │   (Promises, queueMicrotask,           │  │
│   │      EVENT LOOP          │   │    MutationObserver)                    │  │
│   │                          │   │                                         │  │
│   │  "Is the stack empty?    │   │  [ .then(), .catch(), await... ]        │  │
│   │   Run the next task."    │   └────────────────────────────────────────┘  │
│   └──────────────────────────┘                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

Let's understand each player in depth.

## The Call Stack — Where Code Actually Runs

The **call stack** is JavaScript's execution context. Think of it as a stack of plates. When you call a function, a new plate (called a "frame") goes on top. When the function returns, its plate is removed. JavaScript always executes whatever is on top of the stack.

```javascript
function greet(name) {
  // This function is called last but returns first
  return `Hello, ${name}!`;
}

function buildMessage(user) {
  // This calls greet, which adds a new frame on top
  const message = greet(user.name);
  return message;
}

function showWelcome() {
  const user = { name: 'Alice' };
  // This calls buildMessage, which adds a frame, which calls greet, which adds another
  const result = buildMessage(user);
  console.log(result); // 'Hello, Alice!'
}

showWelcome();
```

Here's exactly what the call stack looks like as this code runs:

```text
Step 1: showWelcome() is called
┌──────────────┐
│ showWelcome  │  ← top of stack (currently executing)
└──────────────┘

Step 2: showWelcome calls buildMessage()
┌──────────────┐
│ buildMessage │  ← top of stack (currently executing)
├──────────────┤
│ showWelcome  │  ← waiting for buildMessage to return
└──────────────┘

Step 3: buildMessage calls greet()
┌──────────────┐
│    greet     │  ← top of stack (currently executing)
├──────────────┤
│ buildMessage │  ← waiting for greet to return
├──────────────┤
│ showWelcome  │  ← waiting for buildMessage to return
└──────────────┘

Step 4: greet() returns, its frame is removed
┌──────────────┐
│ buildMessage │  ← top of stack (gets greet's return value)
├──────────────┤
│ showWelcome  │
└──────────────┘

Step 5: buildMessage() returns, its frame is removed
┌──────────────┐
│ showWelcome  │  ← top of stack (gets buildMessage's return value)
└──────────────┘

Step 6: showWelcome() logs and returns, stack is empty
(empty stack)
```

:::tip
This is exactly what you see in an error's "stack trace" in the browser or Node.js. The stack trace is literally the call stack at the moment the error was thrown — reading from top to bottom tells you the exact path of function calls that led to the error.
:::

**What is a Stack Overflow?** When functions call themselves recursively without ever stopping, the stack grows and grows until the browser throws a `Maximum call stack size exceeded` error. There's literally no more room for new frames.

```javascript
// ❌ This causes a stack overflow
function infinity() {
  return infinity(); // calls itself forever, stack grows until crash
}
infinity(); // RangeError: Maximum call stack size exceeded

// ✅ This is fine — a proper base case stops the recursion
function countdown(n) {
  if (n <= 0) {
    console.log('Done!');
    return; // base case: stops the recursion
  }
  console.log(n);
  countdown(n - 1); // recursive call, but will eventually hit the base case
}
countdown(5); // 5, 4, 3, 2, 1, Done!
```

## The Web APIs — Where Slow Things Live

When JavaScript encounters something that takes time — a network request, a timer, a user click — it doesn't handle it directly. It hands it off to the **Web APIs** (in browsers) or **C++ APIs** (in Node.js).

These APIs live _outside_ the JavaScript engine. They're provided by the browser or Node.js environment, and they can handle things in the background without blocking the call stack.

```javascript
console.log('1 - Starting timer');

// setTimeout is handed off to the Web API
// JavaScript doesn't wait here — it moves on IMMEDIATELY
setTimeout(function onTimer() {
  console.log('3 - Timer fired! (after ~1000ms)');
}, 1000);

console.log('2 - Script continues running');

// Output:
// 1 - Starting timer
// 2 - Script continues running
// (1 second passes)
// 3 - Timer fired! (after ~1000ms)
```

Here's what actually happened:

```text
1. JS engine: "I see setTimeout — I'll hand this to the Web API"
   → Call stack: [ ]  (setTimeout itself is done in the JS world)
   → Web API: "I'm counting 1000ms in the background"

2. JS engine: "Call stack is empty, let me run the next line"
   → console.log('2 - Script continues running') executes

3. (1000ms passes in the background)
   → Web API: "Timer done! I'll put onTimer in the callback queue"

4. Event Loop: "Call stack is empty AND there's something in the callback queue"
   → Moves onTimer to the call stack

5. JS engine: "I'll run onTimer"
   → console.log('3 - Timer fired!') executes
```

:::note
The number in `setTimeout(fn, 1000)` is a _minimum_ delay, not a guarantee. If your call stack is busy doing something else when the timer fires, the callback has to wait in the queue until the stack is empty. More on this in a moment.
:::

## The Callback Queue (Macrotask Queue) — The Waiting Room

When a Web API finishes its work (timer expired, network request complete, user clicked a button), it doesn't immediately run the callback. It puts the callback in the **callback queue** (also called the task queue or macrotask queue).

The callback queue is a proper queue — first in, first out. Callbacks are processed in the order they were added.

```javascript
// Let's add multiple timers and see the order they fire
setTimeout(() => console.log('Timer 1: 0ms delay'), 0);
setTimeout(() => console.log('Timer 2: 100ms delay'), 100);
setTimeout(() => console.log('Timer 3: 50ms delay'), 50);
console.log('Synchronous: runs first');

// Output:
// Synchronous: runs first      ← synchronous code runs before ANY timer
// Timer 1: 0ms delay           ← 0ms timer fires after sync code
// Timer 3: 50ms delay          ← 50ms timer fires next
// Timer 2: 100ms delay         ← 100ms timer fires last
```

Things that add callbacks to the **macrotask queue:**

- `setTimeout`
- `setInterval`
- `setImmediate` (Node.js)
- I/O callbacks (network, file system)
- DOM events (click, keydown, scroll, etc.)
- `MessageChannel`

## The Microtask Queue — The VIP Lane

Here's where things get interesting — and where most developers trip up.

There are _two_ queues, and they have very different priorities.

The **microtask queue** is a higher-priority queue that runs _between_ tasks. After every task completes, and before the event loop picks up the next task, it **drains the entire microtask queue first** — running every microtask until the queue is empty.

Things that add callbacks to the **microtask queue:**

- `Promise.then()`, `Promise.catch()`, `Promise.finally()`
- `async/await` (under the hood, these use promises)
- `queueMicrotask(fn)` (explicit API for adding microtasks)
- `MutationObserver` (watches for DOM changes)

```javascript
console.log('1 - Synchronous start');

setTimeout(() => {
  console.log('5 - Macrotask: setTimeout');
}, 0);

Promise.resolve()
  .then(() => console.log('3 - Microtask: Promise .then()'))
  .then(() => console.log('4 - Microtask: chained .then()'));

console.log('2 - Synchronous end');

// Output:
// 1 - Synchronous start        ← synchronous code runs first
// 2 - Synchronous end          ← still synchronous
// 3 - Microtask: Promise .then()  ← microtasks run before macrotasks
// 4 - Microtask: chained .then()  ← ALL microtasks drain before next macrotask
// 5 - Macrotask: setTimeout    ← macrotask runs last
```

> **This is the most important rule in the event loop:**
> After every task (including the initial script), drain ALL microtasks before picking up the next macrotask.

Let's visualize this more carefully:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    EVENT LOOP TICK ORDER                                 │
│                                                                         │
│  ┌──────────────────────────────────────────┐                           │
│  │ 1. Execute the current TASK              │ ← runs one task at a time │
│  │    (initial script, setTimeout cb, etc.) │                           │
│  └──────────────────────┬───────────────────┘                           │
│                         │                                               │
│                         ▼                                               │
│  ┌──────────────────────────────────────────┐                           │
│  │ 2. Drain MICROTASK QUEUE                 │ ← runs ALL microtasks    │
│  │    Run every queued microtask.           │                           │
│  │    If a microtask adds more microtasks,  │                           │
│  │    run those too — until queue is empty  │                           │
│  └──────────────────────┬───────────────────┘                           │
│                         │                                               │
│                         ▼                                               │
│  ┌──────────────────────────────────────────┐                           │
│  │ 3. Render (browser only)                 │ ← update the screen      │
│  │    If needed, the browser paints the UI  │                           │
│  └──────────────────────┬───────────────────┘                           │
│                         │                                               │
│                         ▼                                               │
│  ┌──────────────────────────────────────────┐                           │
│  │ 4. Pick next MACROTASK from queue        │ ← go back to step 1      │
│  │    (setTimeout, click event, etc.)       │                           │
│  └──────────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Putting It All Together — The Event Loop Algorithm

Now we can state the event loop's algorithm precisely:

```text
while (there is more work to do) {
  1. Run the current script / task to completion
     (JavaScript NEVER pauses in the middle of a task)

  2. Drain the microtask queue completely:
     while (microtask queue is not empty) {
       take the next microtask
       execute it
       if it adds more microtasks, add them to the queue
     }

  3. If the browser needs to render, do that

  4. Take the next task from the macrotask queue
     (if the queue is empty, wait until something arrives)
     Go back to step 1
}
```

Let's trace through a complex example step by step:

```javascript
console.log('START'); // Line A

setTimeout(() => console.log('setTimeout 1'), 0); // Line B

Promise.resolve()
  .then(() => {
    // Line C
    console.log('Promise 1');
    setTimeout(() => console.log('setTimeout 2'), 0); // Line D (inside a microtask!)
  })
  .then(() => console.log('Promise 2')); // Line E

setTimeout(() => console.log('setTimeout 3'), 0); // Line F

console.log('END'); // Line G

// What do you think the output is? Take a guess before scrolling down!
```

```text
Let's trace it:

TASK 1 (the script itself):
  Line A: console.log('START')          → prints "START"
  Line B: setTimeout(cb1, 0)            → sends cb1 to Web API; queues cb1 in macrotask queue after 0ms
  Line C: Promise.resolve().then(cb2)   → cb2 added to MICROTASK queue
  Line E: .then(cb3)                    → cb3 will be added to microtask queue when cb2 resolves
  Line F: setTimeout(cb4, 0)            → cb4 queued in macrotask queue
  Line G: console.log('END')            → prints "END"

  Script is done. Microtask queue: [cb2]

MICROTASK DRAIN:
  Run cb2: console.log('Promise 1')     → prints "Promise 1"
           setTimeout(cb5, 0)           → cb5 queued in macrotask queue
           cb2 returned → cb3 is now queued in microtask queue

  Microtask queue still has: [cb3]

  Run cb3: console.log('Promise 2')     → prints "Promise 2"

  Microtask queue is empty. ✓

MACROTASK QUEUE: [cb1, cb4, cb5]

TASK 2: Run cb1:
  console.log('setTimeout 1')          → prints "setTimeout 1"
  No new microtasks.

TASK 3: Run cb4:
  console.log('setTimeout 3')          → prints "setTimeout 3"
  No new microtasks.

TASK 4: Run cb5:
  console.log('setTimeout 2')          → prints "setTimeout 2"

FINAL OUTPUT:
  START
  END
  Promise 1
  Promise 2
  setTimeout 1
  setTimeout 3
  setTimeout 2
```

Notice that `setTimeout 2` prints _last_ even though it was scheduled from inside `Promise 1`. That's because it was scheduled _from a microtask_, so it joins the macrotask queue _after_ `setTimeout 1` and `setTimeout 3` were already there.

## Synchronous vs. Asynchronous — The Foundation

Before diving deeper, let's make sure the difference is crystal clear.

**Synchronous code** runs line by line. Each line must complete before the next one starts. The call stack is the only thing involved.

```javascript
// Synchronous — runs top to bottom, in order, no exceptions
function calculateTotal(prices) {
  let total = 0;
  for (const price of prices) {
    total += price; // must finish before next iteration
  }
  return total; // must finish before caller continues
}

const prices = [9.99, 24.99, 4.49];
const total = calculateTotal(prices); // JS waits here for calculateTotal to return
console.log(total); // 39.47 — runs after calculateTotal completes
```

**Asynchronous code** registers a callback and moves on. The callback runs later, when the async operation finishes.

```javascript
// Asynchronous — registers callback, moves on immediately
console.log('Before fetch');

// fetch() returns immediately — JS does NOT wait for the network response
fetch('https://api.example.com/price')
  .then((response) => response.json()) // runs when response arrives (maybe 200ms later)
  .then((data) => {
    console.log('Price from server:', data.price); // runs after JSON is parsed
  });

console.log('After fetch'); // runs BEFORE the fetch completes

// Output:
// Before fetch
// After fetch
// Price from server: 99.99   ← arrives 200ms later
```

:::warning
A very common beginner mistake is trying to use the result of an async operation as if it were synchronous:
:::

> ```javascript
> // ❌ WRONG — data is undefined here
> let data;
> fetch('/api/data')
>   .then((r) => r.json())
>   .then((result) => {
>     data = result; // This runs LATER, after the fetch completes
>   });
> console.log(data); // undefined — fetch hasn't finished yet!
>
> // ✅ CORRECT — work with data inside the callback
> fetch('/api/data')
>   .then((r) => r.json())
>   .then((result) => {
>     console.log(result); // data is available here
>     doSomethingWith(result); // do your work here
>   });
> ```

# Callbacks — The Original Async Pattern

The simplest way to handle asynchronous operations is with **callbacks** — functions you pass to another function to be called later.

```javascript
// setTimeout takes a callback (the function to run after the delay)
setTimeout(function () {
  console.log('This runs after 2 seconds');
}, 2000);

// DOM events use callbacks
document.getElementById('myButton').addEventListener('click', function (event) {
  console.log('Button was clicked!', event.target);
});

// Node.js file reading uses a callback
const fs = require('fs');
fs.readFile('./menu.txt', 'utf8', function (error, content) {
  if (error) {
    console.error('Could not read file:', error);
    return;
  }
  console.log('File content:', content);
});
```

Callbacks work, but they get painful when you need to chain multiple async operations:

```javascript
// ❌ Callback hell — each async operation depends on the previous one
// This is real code people wrote in 2013. Don't be this person.
getUserFromDatabase(userId, function (error, user) {
  if (error) {
    handleError(error);
    return;
  }

  getUserPermissions(user.id, function (error, permissions) {
    if (error) {
      handleError(error);
      return;
    }

    getProductsForUser(user.id, permissions, function (error, products) {
      if (error) {
        handleError(error);
        return;
      }

      filterByCategory(products, 'electronics', function (error, filtered) {
        if (error) {
          handleError(error);
          return;
        }

        console.log(filtered); // Finally! 4 levels deep.
      });
    });
  });
});
// This pyramid of doom becomes unmaintainable. Error handling is duplicated.
// This is why Promises were invented.
```

## Promises — A Better Way to Handle Async

A **Promise** is an object that represents the eventual result of an asynchronous operation. It can be in one of three states:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     PROMISE STATES                                       │
│                                                                         │
│   PENDING ──────► FULFILLED  (operation succeeded, has a value)         │
│         │                                                               │
│         └───────► REJECTED   (operation failed, has a reason/error)     │
│                                                                         │
│   Once settled (fulfilled or rejected), a promise NEVER changes state.  │
│   A fulfilled promise stays fulfilled forever.                           │
│   A rejected promise stays rejected forever.                            │
└─────────────────────────────────────────────────────────────────────────┘
```

```javascript
// Creating a Promise manually (you'll do this less than you think;
// most async functions return promises for you automatically)
const myPromise = new Promise(function (resolve, reject) {
  // This function runs immediately (synchronously)
  // resolve(value) = operation succeeded with this value
  // reject(error) = operation failed with this error

  const success = true; // pretend this is the result of some operation

  if (success) {
    resolve('The operation worked! Here is your data.');
  } else {
    reject(new Error('Something went wrong!'));
  }
});

// Consuming a Promise with .then() and .catch()
myPromise
  .then(function (value) {
    // Runs if the promise is FULFILLED
    console.log('Success:', value);
  })
  .catch(function (error) {
    // Runs if the promise is REJECTED
    console.error('Error:', error.message);
  })
  .finally(function () {
    // ALWAYS runs, whether fulfilled or rejected
    // Perfect for cleanup: hiding loading spinners, closing connections
    console.log('Done, regardless of outcome');
  });
```

**The key insight:** `.then()`, `.catch()`, and `.finally()` all return _new_ promises, which means you can chain them:

```javascript
// ✅ Promise chaining — same logic as callback hell, but readable
fetch('https://api.example.com/products/123')
  .then((response) => {
    // Check if the HTTP response was ok (status 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); // parse JSON — also returns a promise!
  })
  .then((product) => {
    console.log('Product name:', product.name);
    console.log('Price:', product.price);
    return fetch(`https://api.example.com/reviews/${product.id}`); // chain another request
  })
  .then((response) => response.json())
  .then((reviews) => {
    console.log('Reviews:', reviews);
  })
  .catch((error) => {
    // ONE catch handles errors from ANY step in the chain
    console.error('Something went wrong:', error);
  });
```

**Creating a time-based Promise (a super useful pattern):**

```javascript
// A promisified version of setTimeout — useful for delays in async code
function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms); // resolve (with no value) after ms milliseconds
  });
}

// Usage:
delay(2000).then(() => console.log('2 seconds have passed!'));

// Or with async/await (we'll cover this next):
// await delay(2000);
// console.log('2 seconds have passed!');
```

## Promise.all, Promise.race, and Friends — Running Promises Together

Sometimes you need to run multiple async operations and handle them together.

```javascript
// Promise.all — run in PARALLEL, wait for ALL to complete
// Rejects immediately if ANY promise rejects (fail-fast)
const userPromise = fetch('/api/user/123').then((r) => r.json());
const productPromise = fetch('/api/products').then((r) => r.json());
const settingsPromise = fetch('/api/settings').then((r) => r.json());

Promise.all([userPromise, productPromise, settingsPromise])
  .then(([user, products, settings]) => {
    // ALL THREE are available here — destructured in order
    console.log('User:', user.name);
    console.log('Products:', products.length);
    console.log('Theme:', settings.theme);
  })
  .catch((error) => {
    // If ANY of the three fetches fails, we end up here
    console.error('At least one request failed:', error);
  });

// ─────────────────────────────────────────────────────────────────────

// Promise.allSettled — run in PARALLEL, wait for ALL, never rejects
// Each result tells you whether it fulfilled or rejected
Promise.allSettled([userPromise, productPromise, settingsPromise]).then(
  (results) => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Request ${index} succeeded:`, result.value);
      } else {
        console.log(`Request ${index} failed:`, result.reason);
      }
    });
  },
);
// Use this when you want ALL results even if some fail

// ─────────────────────────────────────────────────────────────────────

// Promise.race — resolves/rejects with WHICHEVER settles first
// Great for timeouts!
function fetchWithTimeout(url, timeoutMs) {
  const fetchPromise = fetch(url).then((r) => r.json());

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Request timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  // Whichever finishes first "wins"
  return Promise.race([fetchPromise, timeoutPromise]);
}

fetchWithTimeout('/api/slow-endpoint', 3000)
  .then((data) => console.log('Got data:', data))
  .catch((error) => console.error(error.message)); // 'Request timed out after 3000ms'

// ─────────────────────────────────────────────────────────────────────

// Promise.any — resolves with the FIRST to FULFILL (ignores rejections)
// Only rejects if ALL promises reject
const mirrors = [
  fetch('https://mirror1.example.com/data'),
  fetch('https://mirror2.example.com/data'),
  fetch('https://mirror3.example.com/data'),
];

Promise.any(mirrors)
  .then((response) => {
    console.log('Got response from the fastest mirror!');
    return response.json();
  })
  .catch(() => {
    console.error('All mirrors failed!');
  });
```

## async/await — Making Async Look Like Sync

`async` and `await` are **syntax sugar** built on top of Promises. They don't introduce new async concepts — they just make Promise-based code _much_ easier to read and write.

**The rules:**

1. `async` before a function makes it always return a Promise
2. `await` pauses execution _of that async function_ until the Promise resolves (but doesn't block the thread — other code can run)
3. You can only use `await` inside an `async` function

```javascript
// Same fetch chain as before — but with async/await
async function loadProductPage(productId) {
  try {
    // await pauses THIS function, but NOT the entire JavaScript engine
    const response = await fetch(
      `https://api.example.com/products/${productId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const product = await response.json(); // pause again for JSON parsing

    const reviewsResponse = await fetch(
      `https://api.example.com/reviews/${product.id}`,
    );
    const reviews = await reviewsResponse.json();

    // All data is available here, reading top-to-bottom like sync code
    console.log('Product:', product.name);
    console.log('Reviews:', reviews.length);

    return { product, reviews }; // async functions always return a Promise
  } catch (error) {
    // try/catch catches errors from any awaited promise in this block
    console.error('Failed to load product page:', error);
    throw error; // re-throw so the caller knows it failed
  }
}

// Calling an async function — it returns a Promise
loadProductPage('123')
  .then((data) => console.log('Loaded:', data))
  .catch((err) => console.error('Outer error handler:', err));

// Or use await in another async function:
async function main() {
  const data = await loadProductPage('123');
  console.log('Loaded:', data);
}
```

**Async/await is just syntactic sugar — here's the proof:**

```javascript
// These two functions are IDENTICAL in behavior:

// Version 1: Promises
function fetchUser_promises(id) {
  return fetch(`/api/users/${id}`)
    .then((response) => response.json())
    .then((user) => {
      console.log(user.name);
      return user;
    });
}

// Version 2: async/await (does EXACTLY the same thing)
async function fetchUser_async(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();
  console.log(user.name);
  return user;
}
```

**Running async operations in parallel with await:**

```javascript
// ❌ SLOW — these run sequentially, each waiting for the previous
async function slowVersion() {
  const user = await fetch('/api/user').then((r) => r.json()); // waits ~200ms
  const products = await fetch('/api/products').then((r) => r.json()); // then waits ~200ms
  const settings = await fetch('/api/settings').then((r) => r.json()); // then waits ~200ms
  // Total: ~600ms — they could be running simultaneously!
}

// ✅ FAST — start all three, then wait for all to finish
async function fastVersion() {
  // Start ALL THREE fetch operations simultaneously (don't await yet)
  const userPromise = fetch('/api/user').then((r) => r.json());
  const productPromise = fetch('/api/products').then((r) => r.json());
  const settingsPromise = fetch('/api/settings').then((r) => r.json());

  // NOW wait for all three to finish (they've been running in parallel)
  const [user, products, settings] = await Promise.all([
    userPromise,
    productPromise,
    settingsPromise,
  ]);
  // Total: ~200ms — as fast as the slowest individual request
}
```

:::tip
One of the most common async/await performance mistakes is awaiting promises one by one inside a loop when the operations are independent of each other. If your loop items don't depend on each other, fetch them all in parallel with `Promise.all`.
:::

```javascript
const productIds = ['101', '102', '103', '104', '105'];

// ❌ Sequential — fetches one at a time, very slow
async function fetchProductsSequential(ids) {
  const products = [];
  for (const id of ids) {
    const product = await fetchProduct(id); // waits for each before moving on
    products.push(product);
  }
  return products; // ~5 × 200ms = 1000ms
}

// ✅ Parallel — fetches all at once
async function fetchProductsParallel(ids) {
  const promises = ids.map((id) => fetchProduct(id)); // starts all fetches immediately
  return Promise.all(promises); // waits for all to complete
  // ~200ms (as long as the slowest single fetch)
}
```

## What "Non-Blocking" Actually Means

This term gets thrown around constantly. Let's nail down exactly what it means.

**Blocking** means the call stack is occupied and nothing else can run.

```javascript
// ❌ BLOCKING — this locks up the entire browser tab for 3 seconds
// During these 3 seconds: no clicks work, no animations play, the page is frozen
function blockFor3Seconds() {
  const start = Date.now();
  // Busy-wait: keep looping until 3 seconds have passed
  while (Date.now() - start < 3000) {
    // doing nothing, but keeping the call stack occupied
  }
  console.log('Done blocking!');
}

console.log('Before block');
blockFor3Seconds(); // EVERYTHING freezes for 3 seconds here
console.log('After block'); // only runs after 3 seconds
```

**Non-blocking** means the call stack is free to do other work while waiting.

```javascript
// ✅ NON-BLOCKING — the call stack is free during the 3-second wait
// During these 3 seconds: clicks work, animations play, other code runs normally
function waitFor3Seconds() {
  return new Promise((resolve) => {
    setTimeout(resolve, 3000); // hand the waiting to the Web API
    // Call stack is free immediately — we return here
  });
}

console.log('Before wait');
waitFor3Seconds().then(() => {
  console.log('Done waiting!'); // runs after 3 seconds, via the event loop
});
console.log('After wait setup'); // runs IMMEDIATELY after waitFor3Seconds() returns

// Output:
// Before wait
// After wait setup    ← immediate
// (3 seconds pass)
// Done waiting!
```

:::warning
Even though JavaScript is non-blocking for I/O operations, you can still block the event loop with heavy synchronous computation. If you have a function that runs a complex algorithm and takes 5 seconds of CPU work, it _will_ block the thread for those 5 seconds. For CPU-intensive work in the browser, use Web Workers. In Node.js, use worker_threads.
:::

## setInterval — Repeating Timers

`setInterval` is like `setTimeout` but repeats.

```javascript
let count = 0;

// Runs the callback every 1000ms (approximately)
const intervalId = setInterval(function () {
  count++;
  console.log(`Tick #${count}`);

  // ALWAYS store the interval ID so you can stop it later
  if (count >= 5) {
    clearInterval(intervalId); // stop the interval after 5 ticks
    console.log('Interval stopped!');
  }
}, 1000);

// Output (one line per second):
// Tick #1
// Tick #2
// Tick #3
// Tick #4
// Tick #5
// Interval stopped!
```

:::warning
Be careful with `setInterval` when the callback might take longer than the interval. If your callback takes 2000ms but the interval is 1000ms, callbacks will pile up. Often it's safer to use a recursive `setTimeout` instead:
:::

```javascript
// ❌ setInterval with slow callback can pile up
setInterval(async function () {
  await doSlowOperation(); // if this takes 3000ms, next interval fires before this finishes!
}, 1000);

// ✅ Recursive setTimeout — next call only starts after current one completes
async function poll() {
  await doSlowOperation(); // wait for completion
  setTimeout(poll, 1000); // schedule next run AFTER current is done
}

poll(); // start the polling
```

## Event Listeners and the Event Loop

User interactions (clicks, keypresses, scroll) go through the event loop just like timers.

```javascript
const button = document.getElementById('submitButton');

// The click callback is registered in the Web API (DOM events system)
// When the user clicks, the callback goes into the macrotask queue
button.addEventListener('click', function handleClick(event) {
  console.log('Button clicked!');
  event.preventDefault(); // prevent form submission

  // All the event loop rules apply here — this is a macrotask
  Promise.resolve().then(() => {
    console.log('This microtask runs before the next click event');
  });
});

// Multiple listeners on the same element fire in registration order
button.addEventListener('click', function secondHandler() {
  console.log('Second handler — always runs after the first');
});
```

**Removing event listeners to prevent memory leaks:**

```javascript
function setupCounter() {
  let count = 0;
  const button = document.getElementById('counterButton');

  function handleClick() {
    count++;
    console.log(`Count: ${count}`);

    if (count >= 10) {
      // Clean up when done — important to prevent memory leaks
      button.removeEventListener('click', handleClick);
      console.log('Counter disabled after 10 clicks');
    }
  }

  // Store reference to the named function so you can remove it later
  button.addEventListener('click', handleClick);
}

setupCounter();
```

## The Event Loop in Node.js — Slightly Different

Node.js uses the same event loop concept but has more phases (powered by libuv, a C++ library). Node.js adds two extra "queues" you should know:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                     NODE.JS EVENT LOOP PHASES                            │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │ 1. timers          → setTimeout, setInterval callbacks           │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │ 2. pending callbacks → I/O errors from previous loop iteration   │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │ 3. idle, prepare   → internal Node.js use                        │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │ 4. poll            → retrieve new I/O events; run I/O callbacks  │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │ 5. check           → setImmediate callbacks                      │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │ 6. close callbacks → socket.on('close', ...) etc.                │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   Between EVERY phase: microtask queue is fully drained                  │
│   (Promise callbacks, process.nextTick)                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

Node.js has two special functions:

```javascript
// process.nextTick — runs BEFORE microtasks (even before Promise.then)
// Think of it as "before the next anything"
// Use sparingly — can starve the event loop if overused

process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('Promise'));
setImmediate(() => console.log('setImmediate'));
setTimeout(() => console.log('setTimeout'), 0);
console.log('synchronous');

// Output:
// synchronous     ← current synchronous code
// nextTick        ← process.nextTick (before promises!)
// Promise         ← microtask queue
// setTimeout      ← macrotask (timer phase)
// setImmediate    ← macrotask (check phase, after I/O)
```

:::note
`setImmediate` vs `setTimeout(fn, 0)` in Node.js: when called from outside an I/O callback, the order is non-deterministic. When called from inside an I/O callback, `setImmediate` always runs first. In general code, use `setImmediate` when you want "after the current I/O events are processed."
:::

# Common Event Loop Gotchas

### Gotcha 1: `setTimeout(fn, 0)` is NOT zero delay

```javascript
console.log('Before');

setTimeout(() => {
  console.log('setTimeout'); // always after synchronous code, no matter what
}, 0); // 0ms delay!

console.log('After');

// Output (ALWAYS):
// Before
// After
// setTimeout   ← even with 0ms delay, waits for sync code to finish
```

### Gotcha 2: Promises in loops need care

```javascript
const items = [1, 2, 3, 4, 5];

// ❌ forEach with async doesn't wait — forEach doesn't understand promises
async function processItems_wrong() {
  items.forEach(async (item) => {
    await processItem(item); // forEach doesn't await these!
  });
  console.log('Done?'); // runs BEFORE any items are processed!
}

// ✅ Use for...of with await for sequential processing
async function processItems_sequential() {
  for (const item of items) {
    await processItem(item); // properly waits for each
  }
  console.log('Done!'); // runs after ALL items are processed
}

// ✅ Use Promise.all for parallel processing
async function processItems_parallel() {
  await Promise.all(items.map((item) => processItem(item)));
  console.log('Done!'); // runs after ALL items are processed (in parallel)
}
```

### Gotcha 3: The closure trap in setTimeout loops

```javascript
// ❌ Classic bug — all callbacks share the SAME 'i' variable
for (var i = 0; i < 5; i++) {
  setTimeout(function () {
    console.log(i); // prints 5, 5, 5, 5, 5 — not 0, 1, 2, 3, 4!
  }, i * 1000);
}
// Why? var is function-scoped, not block-scoped.
// By the time the callbacks run, the loop has finished and i = 5.

// ✅ Fix 1: Use let instead of var (block-scoped, each iteration gets its own i)
for (let i = 0; i < 5; i++) {
  setTimeout(function () {
    console.log(i); // prints 0, 1, 2, 3, 4 correctly
  }, i * 1000);
}

// ✅ Fix 2: Create a new scope with an IIFE (for environments without let)
for (var i = 0; i < 5; i++) {
  (function (capturedI) {
    setTimeout(function () {
      console.log(capturedI); // capturedI is a new variable for each iteration
    }, capturedI * 1000);
  })(i);
}
```

### Gotcha 4: Unhandled Promise rejections

```javascript
// ❌ This rejection is silently swallowed — terrible for debugging
async function riskyOperation() {
  throw new Error('Something went wrong!');
}

riskyOperation(); // No .catch(), no try/catch — error is lost in older Node versions

// ✅ Always handle rejections
riskyOperation().catch((err) => console.error('Caught:', err));

// ✅ Or with async/await
async function main() {
  try {
    await riskyOperation();
  } catch (err) {
    console.error('Caught:', err);
  }
}

// ✅ Global safety net (use as a last resort, not a substitute for proper handling)
// In browser:
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// In Node.js:
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1); // fail fast in production
});
```

### Gotcha 5: Long microtask chains can starve the render

```javascript
// ⚠️ This can prevent the browser from painting the UI
// because microtasks drain completely before rendering
function recursiveMicrotask(count) {
  if (count <= 0) return;
  Promise.resolve().then(() => {
    // Do some work...
    recursiveMicrotask(count - 1); // adds another microtask
  });
}

// This runs 10,000 microtasks before the browser gets a chance to render
// The user sees a frozen screen during this time
recursiveMicrotask(10000);

// ✅ Break up long work with setTimeout to let the browser breathe
function recursiveWithBreaths(count) {
  if (count <= 0) return;
  // Do some work...
  setTimeout(() => recursiveWithBreaths(count - 1), 0); // yields to the browser
}
```

## Visualizing the Event Loop — A Complete Walkthrough

Let's do one final, comprehensive trace of a real-world scenario:

```javascript
async function loadDashboard() {
  console.log('[1] loadDashboard started');

  const userPromise = fetch('/api/user'); // fires immediately
  const statsPromise = fetch('/api/stats'); // fires immediately

  console.log('[2] Both fetches initiated');

  // Await both — whichever finishes first doesn't matter
  const [userRes, statsRes] = await Promise.all([userPromise, statsPromise]);

  console.log('[4] Both fetches complete');

  const [user, stats] = await Promise.all([userRes.json(), statsRes.json()]);

  console.log('[5] Data parsed:', user.name, stats.total);
}

console.log('[0] Script starts');
loadDashboard();
console.log("[3] loadDashboard returned (it's async!)");

// Output order:
// [0] Script starts
// [1] loadDashboard started
// [2] Both fetches initiated
// [3] loadDashboard returned (it's async!)   ← BEFORE the awaited data arrives!
// (network requests complete in the background)
// [4] Both fetches complete
// [5] Data parsed: Alice 1234
```

The key insight: `[3]` prints before `[4]` and `[5]` even though it appears _after_ `loadDashboard()` in the code. This is because `loadDashboard()` is `async` — calling it returns a Promise immediately (when it hits the first `await`), and the code below it continues running.

## Quick Reference — The Event Loop in 10 Rules

> 1. JavaScript runs on one thread — one thing at a time in the engine.
> 2. The call stack must be empty before async callbacks can run.
> 3. Synchronous code ALWAYS runs before any async callback.
> 4. Microtasks (Promises, queueMicrotask) have higher priority than macrotasks (setTimeout, setInterval, I/O).
> 5. After every task, ALL microtasks drain before the next task runs.
> 6. setTimeout(fn, 0) ≠ "run immediately" — it means "run after current task and all pending microtasks".
> 7. await pauses the current async function, NOT the thread. Other code can run while await is waiting.
> 8. Long synchronous operations BLOCK the event loop. Use Web Workers or break work into chunks for CPU-heavy tasks.
> 9. Always handle Promise rejections — unhandled ones are silent bugs.
> 10. async/await is syntactic sugar for Promises. They don't change the event loop — just the syntax

## Practice Exercises — Test Your Understanding

Work through these before reading the answers. Predict the output order.

**Exercise 1:**

```javascript
console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');
Promise.resolve().then(() => console.log('D'));
console.log('E');
// What is the output order? (Answer: A, C, E, D, B)
```

**Exercise 2:**

```javascript
Promise.resolve()
  .then(() => {
    console.log('micro 1');
    setTimeout(() => console.log('macro 2'), 0);
  })
  .then(() => console.log('micro 3'));

setTimeout(() => console.log('macro 1'), 0);
// What is the output order? (Answer: micro 1, micro 3, macro 1, macro 2)
```

**Exercise 3:**

```javascript
async function alpha() {
  console.log('alpha start');
  await Promise.resolve();
  console.log('alpha end');
}

async function beta() {
  console.log('beta start');
  await Promise.resolve();
  console.log('beta end');
}

console.log('start');
alpha();
beta();
console.log('end');
// What is the output order?
// (Answer: start, alpha start, beta start, end, alpha end, beta end)
```

:::note
The event loop is one of those concepts that seems confusing at first but suddenly "clicks" — and once it does, you'll find yourself predicting JavaScript's behavior with confidence. Every async pattern you use, every Promise you chain, every `await` you write is just the event loop doing its job. Understanding it deeply transforms you from someone who writes async code that works by luck into someone who writes it with deliberate control.
:::
