---
title: 'All About Asynchronization in JavaScript'
published: 2026-03-13
draft: false
description: "A deep, practical dive into JavaScript's asynchronous behavior, from the event loop and task queues to promises, async/await, and real world patterns."
toc: true
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

## Why JavaScript Feels Single Threaded

JavaScript is often described as **single threaded** and yet your apps handle **network requests, timers, user input, rendering, and more seemingly in parallel**. The key is that JavaScript itself runs on **one main thread**, but it cooperates with the **host environment** (the browser or Node.js) that does the heavy lifting asynchronously.

At any moment, JavaScript is doing exactly **one thing** on the **call stack**. Everything else – timers, network I/O, file I/O, background work – is handled by the environment, which later **queues callbacks** for JavaScript to run.

```javascript
console.log('A');

setTimeout(() => {
  console.log('B');
}, 0);

console.log('C');
```

Even with a delay of `0`, the output is:

```shell
A
C
B
```

The reason is the **event loop** and **task queues**. The timeout callback only runs **after** the current synchronous work (logging `A` and `C`) is finished and the call stack is empty.

Understanding that **everything asynchronous is really about scheduling future work** is the foundation for mastering async behavior in JavaScript.

## The Call Stack

Before talking about asynchrony, you need a solid mental model of **synchronous execution**.

- **Call stack**: a stack of frames representing which functions are currently running and who called whom.
- When a function is called, a new frame is pushed onto the stack.
- When a function returns, its frame is popped off.
- While there is at least one frame on the stack, JavaScript is **busy**.

```javascript
function third() {
  console.log('third');
}

function second() {
  console.log('second');
  third();
}

function first() {
  console.log('first');
  second();
}

first();
```

Conceptually the stack evolves like this:

- Start with an empty stack.
- Push `first`, then inside it push `second`, then `third`.
- Pop `third`, then `second`, then `first`.

No asynchronous behavior is involved here. While the call stack is **not empty**, no asynchronous callbacks can run.

This is why **heavy synchronous work blocks everything else** – if you run a long `while` loop or CPU intensive algorithm synchronously, the UI freezes and no timer or network callback can run until that work finishes.

```javascript
console.log('Start heavy work');

const start = Date.now();
while (Date.now() - start < 3000) {
  // Busy loop for three seconds
}

console.log('End heavy work');
```

During those three seconds:

- No button click handlers run.
- No `setTimeout` callbacks run.
- The page feels frozen.

This is the core limitation of **single threaded JavaScript**.

## The Event Loop And Queues

The **event loop** is a coordination mechanism between:

- The **call stack** (where JavaScript executes).
- One or more **task queues** (also called **macrotask queues**).
- The **microtask queue** (primarily used by promises).
- The host environment (browser or Node.js) that enqueues tasks.

At a high level, the event loop repeatedly does the following:

1. If the call stack is **not empty**, keep running the current task.
2. When the call stack becomes empty:
   - First, process all **microtasks** in the microtask queue until it is empty.
   - Then, take the next **macrotask** from the appropriate task queue and run it.
3. Repeat forever.

Examples of **macrotask producers**:

- `setTimeout`, `setInterval`
- DOM events (click, scroll, input)
- `requestAnimationFrame` (with its own timing semantics)
- `MessageChannel` and `postMessage`

Examples of **microtask producers**:

- `Promise.then`, `Promise.catch`, `Promise.finally`
- `queueMicrotask`
- `MutationObserver` (in browsers)

The **ordering rules** between these queues explain many surprising outcomes.

## Timers: setTimeout And setInterval

Timers are often the first async API developers encounter.

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timer fired');
}, 1000);

console.log('End');
```

The sequence:

- `console.log('Start')` runs.
- Timer is registered with the environment.
- `console.log('End')` runs.
- After at least 1000 ms, when the stack is empty, the environment enqueues the timer callback as a macrotask.
- Eventually the event loop picks it and runs `console.log('Timer fired')`.

The delay you pass to `setTimeout` is a **minimum delay**, not a guarantee. If your program is busy when the delay elapses, the callback will be delayed further.

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Timer callback');
}, 0);

// Block for a while
const start = Date.now();
while (Date.now() - start < 2000) {}

console.log('End');
```

Even with a delay of `0`, the callback will only run **after** the heavy loop and `console.log('End')`. In practice, it fires around two seconds later because the event loop cannot schedule the macrotask while the call stack is busy.

`setInterval` behaves similarly, but repeats until cleared:

```javascript
let count = 0;
const id = setInterval(() => {
  console.log('Tick', ++count);
  if (count === 3) {
    clearInterval(id);
  }
}, 1000);
```

The environment tries to respect the interval, but if your code runs longer than the interval, ticks may be delayed or effectively merged.

## Promises And Microtasks

**Promises** are JavaScript's built in abstraction for representing values that are available **later**. Crucially, all `.then`, `.catch`, and `.finally` callbacks are scheduled as **microtasks**.

```javascript
console.log('Start');

Promise.resolve().then(() => {
  console.log('Microtask callback');
});

console.log('End');
```

Output:

```shell
Start
End
Microtask callback
```

The sequence is:

- `Promise.resolve().then(...)` registers a microtask to run the callback.
- The current script finishes (`Start`, then `End`).
- The call stack becomes empty.
- The event loop drains the microtask queue, so `Microtask callback` logs next.

Compare this with `setTimeout`:

```javascript
console.log('Start');

setTimeout(() => {
  console.log('Macrotask callback');
}, 0);

Promise.resolve().then(() => {
  console.log('Microtask callback');
});

console.log('End');
```

Output:

```shell
Start
End
Microtask callback
Macrotask callback
```

Even with zero delay, the timer callback is a **macrotask** and only runs after the microtask queue has been emptied.

### Chaining Promises

Each `.then` in a chain enqueues another microtask. This means long promise chains run very quickly, but importantly they still yield control between microtasks, allowing the environment to update rendering in between in some cases.

```javascript
Promise.resolve(1)
  .then((value) => {
    console.log('First then', value);
    return value + 1;
  })
  .then((value) => {
    console.log('Second then', value);
    return value + 1;
  })
  .then((value) => {
    console.log('Third then', value);
  });

console.log('Synchronous end');
```

The `then` callbacks are all microtasks and will run after the current synchronous script finishes.

## Async And Await

`async` and `await` are **syntax sugar** over promises. They make asynchronous code **look synchronous**, but the underlying behavior is still promise based.

```javascript
async function getUser() {
  const response = await fetch('/api/user');
  const data = await response.json();
  return data;
}

getUser()
  .then((user) => {
    console.log('User', user);
  })
  .catch((error) => {
    console.error('Failed', error);
  });
```

Key properties:

- An `async` function **always returns a promise**, even if you `return` a plain value.
- Every `await` **pauses** the function until the awaited promise settles, then continues.
- The rest of the function body after an `await` is effectively scheduled as a **microtask** associated with the promise.

You can view this transformation conceptually:

```javascript
async function example() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}

example();
console.log('C');
```

Output:

```shell
A
C
B
```

Equivalent desugared version:

```javascript
function example() {
  console.log('A');
  return Promise.resolve().then(() => {
    console.log('B');
  });
}

example();
console.log('C');
```

Async functions simply make it **more ergonomic** to write promise chains that read like straight line code.

## Async Error Handling

With promises, errors propagate through the chain until a `.catch` or `.finally` handles them.

```javascript
Promise.resolve()
  .then(() => {
    throw new Error('Something went wrong');
  })
  .then(() => {
    console.log('This will not run');
  })
  .catch((error) => {
    console.error('Caught', error.message);
  });
```

With `async` functions, `throw` behaves like rejecting the returned promise, and `try`/`catch` works naturally.

```javascript
async function mayFail() {
  throw new Error('Oops');
}

async function run() {
  try {
    await mayFail();
    console.log('This will not run');
  } catch (error) {
    console.error('Caught', error.message);
  } finally {
    console.log('Cleanup logic');
  }
}

run();
```

Common pitfalls:

- **Forgetting to return a promise** inside `.then`, causing the next `.then` to run too early.
- **Swallowing errors** by catching them and not rethrowing or returning a rejected promise.
- **Unhandled promise rejections**, which in modern environments can terminate the process (Node.js) or appear as global errors in the console (browsers).

To observe unhandled rejections in the browser:

```javascript
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection', event.reason);
});

Promise.reject(new Error('Not handled'));
```

In Node.js:

```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at', promise, 'reason:', reason);
});

Promise.reject(new Error('Not handled'));
```

Robust async code always **handles promise rejections** either via `catch` or with `try`/`catch` inside `async` functions.

## Microtasks Versus Macrotasks

Understanding microtasks and macrotasks explains many ordering puzzles.

```javascript
console.log('Script start');

setTimeout(() => {
  console.log('Timeout');
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise then one');
  })
  .then(() => {
    console.log('Promise then two');
  });

console.log('Script end');
```

Execution ordering:

1. `Script start` logs.
2. Timer is scheduled as a macrotask.
3. First `then` callback is scheduled as a microtask.
4. Second `then` is scheduled as a chained microtask.
5. `Script end` logs.
6. Event loop sees the stack is empty and drains the microtask queue:
   - `Promise then one`
   - `Promise then two`
7. Only after the microtask queue is empty is the timer macrotask dequeued:
   - `Timeout`

One important consequence: if you schedule **too many microtasks in a row**, you can **starve macrotasks** like rendering and timers.

```javascript
function floodMicrotasks() {
  Promise.resolve().then(() => {
    console.log('Microtask');
    floodMicrotasks();
  });
}

floodMicrotasks();
console.log('End of script');
```

This is a contrived example, but it shows that microtasks run **before** the event loop goes back to macrotasks, so infinite microtask chains effectively block progression of the loop, similar to synchronous loops.

## Browser Async APIs

The browser provides many asynchronous APIs that integrate with the event loop.

### Fetch Requests

`fetch` returns a promise, so it interacts directly with the microtask queue.

```javascript
console.log('Before fetch');

fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then((response) => response.json())
  .then((data) => {
    console.log('Fetched data', data);
  })
  .catch((error) => {
    console.error('Fetch error', error);
  });

console.log('After fetch');
```

The browser:

- Starts the network request asynchronously using internal threads.
- When the response is ready, the environment enqueues a promise resolution.
- The `.then` callbacks run as microtasks.

With `async` and `await`:

```javascript
async function loadTodo() {
  try {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/todos/1',
    );
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const json = await response.json();
    console.log('Todo', json);
  } catch (error) {
    console.error('Failed to load todo', error);
  }
}

loadTodo();
```

### DOM Events

DOM events are delivered as macrotasks. For example, a `click` listener runs in a macrotask.

```javascript
const button = document.querySelector('button');

button.addEventListener('click', () => {
  console.log('Clicked');

  Promise.resolve().then(() => {
    console.log('Microtask inside click');
  });

  setTimeout(() => {
    console.log('Timeout inside click');
  }, 0);
});
```

Click order:

- Click event fires, the listener runs in a macrotask.
- The listener schedules a microtask and a macrotask (timeout).
- After the listener returns and the event macrotask finishes, the event loop first drains the microtask queue:
  - `Microtask inside click`
- Only then does it process the next macrotask:
  - `Timeout inside click`

### Animation With requestAnimationFrame

`requestAnimationFrame` schedules a callback to run **before the next repaint**, as a special kind of macrotask aligned with the browser's rendering loop.

```javascript
function step(timestamp) {
  console.log('Animation frame at', timestamp);
  requestAnimationFrame(step); // loop
}

requestAnimationFrame(step);
```

Because callbacks run just before painting, `requestAnimationFrame` is ideal for smooth animations and complex visual updates. It will **pause when the tab is in the background**, saving resources.

## Node.js Async Behavior

In Node.js, JavaScript also runs on a single thread, but the async work is powered by **libuv** and its own event loop phases.

Node.js has several important queues and phases:

- **Timers**: `setTimeout`, `setInterval`.
- **Pending callbacks**: I/O callbacks.
- **Idle and prepare**: internal use.
- **Poll**: retrieve new I/O events.
- **Check**: `setImmediate` callbacks.
- **Close callbacks**: close events.

Microtasks (promises) run:

- After each phase, before proceeding to the next.

### process.nextTick Versus Promises

Node.js has `process.nextTick`, which schedules callbacks in a **next tick queue** that runs **before** regular microtasks.

```javascript
console.log('Start');

process.nextTick(() => {
  console.log('Next tick');
});

Promise.resolve().then(() => {
  console.log('Promise microtask');
});

console.log('End');
```

Output:

```shell
Start
End
Next tick
Promise microtask
```

If you abuse `process.nextTick` in a loop, you can starve the normal event loop phases even more aggressively than microtasks.

### setImmediate Versus setTimeout

`setImmediate` queues a callback in the **check phase** of the Node.js event loop, whereas `setTimeout(fn, 0)` queues it in the **timers phase**.

```javascript
setTimeout(() => {
  console.log('Timeout');
}, 0);

setImmediate(() => {
  console.log('Immediate');
});
```

The ordering between them can vary, but in many cases `setImmediate` will run **after** I/O events and **before** some timers. The precise ordering depends on when the calls are made in relation to the poll phase.

Understanding these phases becomes important when writing low level Node.js libraries that depend on precise callback ordering, though most application code can simply rely on `async`/`await` and promises.

## Async Concurrency Patterns

Because JavaScript is single threaded, concurrency is really about **scheduling multiple asynchronous operations** and deciding how they should be combined.

### Sequential Versus Parallel Await

Sequential execution:

```javascript
async function getUserAndPostsSequential() {
  const user = await fetch('/api/user').then((r) => r.json());
  const posts = await fetch(`/api/users/${user.id}/posts`).then((r) =>
    r.json(),
  );
  return { user, posts };
}
```

Each `await` waits for the previous network request to complete before starting the next. This is sometimes necessary (for example, when the second request depends on the first).

Parallel execution:

```javascript
async function getUserAndProfileParallel() {
  const userPromise = fetch('/api/user').then((r) => r.json());
  const profilePromise = fetch('/api/profile').then((r) => r.json());

  const [user, profile] = await Promise.all([userPromise, profilePromise]);
  return { user, profile };
}
```

Here both requests start immediately. `Promise.all` waits until **both** are resolved, or rejects as soon as one fails.

### Promise.all, .race, .any, .allSettled

The Promise combinators control how multiple async operations are coordinated.

```javascript
const p1 = fetch('/api/slow');
const p2 = fetch('/api/fast');

// Waits for both, fails fast
Promise.all([p1, p2])
  .then(([slow, fast]) => {
    console.log('Both responses ready');
  })
  .catch((error) => {
    console.error('One request failed', error);
  });

// Resolves or rejects with the first settled promise
Promise.race([p1, p2]).then((result) => {
  console.log('First completed request', result.url);
});

// Resolves with the first fulfilled, ignores rejections unless all rejected
Promise.any([p1, p2])
  .then((winner) => {
    console.log('First successful response', winner.url);
  })
  .catch((aggregateError) => {
    console.error('All requests failed', aggregateError.errors);
  });

// Waits for all, always resolves with statuses
Promise.allSettled([p1, p2]).then((results) => {
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      console.log('Fulfilled', result.value.url);
    } else {
      console.error('Rejected', result.reason);
    }
  });
});
```

These helpers are crucial for building robust concurrent workflows.

## Cancellation With AbortController

JavaScript promises themselves **do not support cancellation**, but many modern APIs accept an **AbortSignal** that allows you to abort an operation.

```javascript
const controller = new AbortController();
const { signal } = controller;

async function loadWithTimeout(url, ms) {
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

loadWithTimeout('/api/slow', 2000)
  .then((data) => {
    console.log('Data', data);
  })
  .catch((error) => {
    if (error.name === 'AbortError') {
      console.warn('Request aborted');
    } else {
      console.error('Request failed', error);
    }
  });
```

In this pattern:

- A timer aborts the controller after a certain delay.
- The fetch promise rejects with an `AbortError`.
- The `finally` block clears the timeout so it does not fire unnecessarily.

Similar patterns can be implemented for custom async operations by listening to `signal.aborted`.

## Long Running Work And Workers

Because heavy synchronous work blocks the event loop, browsers and Node.js provide ways to move such work off the main thread:

- **Web Workers** in the browser.
- **Worker threads** in Node.js.

In browsers:

```javascript
// main.js
const worker = new Worker('./worker.js', { type: 'module' });

worker.postMessage({ type: 'compute', payload: 1000000000 });

worker.addEventListener('message', (event) => {
  console.log('Result from worker', event.data);
});
```

```javascript
// worker.js
self.addEventListener('message', (event) => {
  if (event.data.type === 'compute') {
    const n = event.data.payload;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += i;
    }
    self.postMessage(sum);
  }
});
```

The main thread remains responsive while the worker performs CPU heavy work in parallel. Communication is asynchronous via `postMessage` and events, which again go through the event loop.

## Common Async Pitfalls

Asynchronous behavior introduces many non obvious problems. Here are some of the most common issues.

### Callback Hell

Before promises, asynchronous code often used nested callbacks that grew to the right.

```javascript
readFile('config.json', (err, config) => {
  if (err) return callback(err);
  readFile(config.path, (err, data) => {
    if (err) return callback(err);
    transform(data, (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  });
});
```

Promises and `async`/`await` flatten this structure and centralize error handling.

```javascript
async function processFile() {
  const config = JSON.parse(await readFileAsync('config.json', 'utf8'));
  const data = await readFileAsync(config.path, 'utf8');
  return transformAsync(data);
}

processFile()
  .then((result) => console.log('Result', result))
  .catch((error) => console.error('Error', error));
```

The underlying behavior is still asynchronous, but the control flow becomes easier to reason about.

### Async Array Method Pitfalls

Methods like `forEach`, `map`, `filter`, and `reduce` **do not await** async callbacks automatically.

```javascript
const urls = ['a.json', 'b.json', 'c.json'];

urls.forEach(async (url) => {
  const response = await fetch(url);
  console.log('Fetched', url, 'status', response.status);
});

console.log('Loop done');
```

`console.log('Loop done')` will run **before** any fetch completes, and errors in the async callbacks may be unhandled.

Preferred patterns:

```javascript
// Parallel fetches with proper error handling
async function fetchAll(urls) {
  const promises = urls.map((url) => fetch(url).then((r) => r.json()));
  return Promise.all(promises);
}

// Sequential processing with for..of
async function fetchSequential(urls) {
  for (const url of urls) {
    const response = await fetch(url);
    const json = await response.json();
    console.log('Sequential fetch', url, json);
  }
}
```

### Forgetting To Await

Forgetting to `await` an async function call is a common source of subtle bugs.

```javascript
async function saveUser(user) {
  await db.save(user);
}

async function handleRequest() {
  saveUser({ name: 'Ada' });
  console.log('User saved'); // Logs before save completes
}
```

The fix is to `await` the call or return the promise.

```javascript
async function handleRequest() {
  await saveUser({ name: 'Ada' });
  console.log('User saved'); // Now logs after save completes
}
```

Alternatively:

```javascript
function handleRequest() {
  return saveUser({ name: 'Ada' }).then(() => {
    console.log('User saved');
  });
}
```

### Race Conditions

Asynchronous operations can complete in different orders than expected, creating races.

```javascript
let latestQueryId = 0;

async function search(term) {
  const queryId = ++latestQueryId;
  const results = await fetch(`/api/search?q=${encodeURIComponent(term)}`).then(
    (r) => r.json(),
  );

  if (queryId === latestQueryId) {
    renderResults(results);
  } else {
    console.log('Discarding stale results for', term);
  }
}
```

If users type quickly and multiple requests are in flight, this pattern ensures only the **most recent** response updates the UI.

## Testing Async JavaScript

Testing async behavior requires **waiting** for promises or timers to settle.

With Jest and async functions:

```javascript
test('fetches user', async () => {
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, name: 'Ada' }),
  });

  global.fetch = mockFetch;

  const user = await getUser(); // async function under test

  expect(user).toEqual({ id: 1, name: 'Ada' });
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
```

With timers:

```javascript
jest.useFakeTimers();

test('debounces calls', () => {
  const callback = jest.fn();
  const debounced = debounce(callback, 300);

  debounced();
  debounced();
  debounced();

  jest.advanceTimersByTime(299);
  expect(callback).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(1);
});
```

Good async tests:

- Explicitly wait for promises with `await` or returned promises.
- Control time using fake timers when testing timer based behavior.
- Avoid relying on real network or time delays whenever possible.

## Async Mental Models

To reason about async JavaScript, keep the following mental models in mind.

- There is **one** main JavaScript thread with a single call stack.
- Asynchronous operations are **delegated** to the environment, which later schedules callbacks.
- The **event loop** controls when queued callbacks run.
- **Microtasks** (promises) run **before** the event loop picks the next macrotask.
- Synchronous code, long microtask chains, and heavy loops can all **block** progress of the event loop.

> When debugging, it often helps to trace:
> _who schedules what, on which queue, and when_

If you can answer:

- Is this callback a microtask or a macrotask?
- Who created this promise and when does it resolve?
- Does any synchronous work block the loop before this callback can run?

Then you can usually predict and control asynchronous behavior precisely.

## Putting It All Together

Asynchronization in JavaScript is not magic. It is a disciplined cooperation between:

- A single threaded engine running your JavaScript.
- An event loop that pulls tasks from queues.
- A host environment that performs I/O, timers, and other work in the background.
- Language constructs like promises and `async`/`await` that let you model future values and compose them safely.

By understanding call stacks, event loops, microtasks, macrotasks, promises, async functions, browser and Node.js specific behaviors, and common patterns, you gain the ability to write **responsive, robust, and predictable** asynchronous JavaScript.

The core idea to remember is simple:

:::note
Asynchronous JavaScript is just scheduled work.
The art is in choosing when and how to schedule it.
:::
