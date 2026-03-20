---
title: 'Flattening and Unflattening Objects in JavaScript'
published: 2026-01-12
draft: false
description: 'Flattening an object converts a nested object into a single-level object with dot-notation (or custom separator) keys. Unflattening does the reverse — it takes a flat object and rebuilds the nested structure.'
toc: false
tags: ['javascript']
icons: ['javascript']
tech: 'js'
---

## Why Flatten / Unflatten?

- Sending data to APIs that expect flat structures
- Storing complex objects in databases (NoSQL, key-value stores)
- Comparing deeply nested objects more easily
- Working with form libraries (many expect flat keys)
- Serializing nested data into query strings or CSV-like formats

## Flattening an object with dot notation

```javascript
/**
 * Flattens a nested object into a single-level object with dot notation keys
 * @param {Object} obj - The object to flatten
 * @param {string} [prefix=''] - Internal: current key prefix
 * @returns {Object} Flattened object
 */
function flattenObject(obj, prefix = '') {
  // Result object that will contain all flattened key-value pairs
  const result = {};

  // Loop through every key in the current object
  for (const key in obj) {
    // Skip inherited properties (rare but good practice)
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    // Create the full key name (prefix + current key)
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Get the value for current key
    const value = obj[key];

    // Check if value is a non-null object (and not Array — we treat arrays as values)
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursive call: flatten nested object and merge into result
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      // Primitive value (or array/null) → add directly to result
      result[fullKey] = value;
    }
  }

  return result;
}

// ────────────────────────────────────────────────

const person = {
  name: 'John Smith',
  age: 28,
  address: {
    city: 'California',
    pincode: 12345,
    coordinates: {
      lat: 82.9716,
      lng: 47.5946,
    },
  },
  hobbies: ['teaching', 'coding'],
};

const flat = flattenObject(person);

console.log(flat);
/* Output:
{
  "name": "John Smith",
  "age": 28,
  "address.city": "California",
  "address.pincode": 12345,
  "address.coordinates.lat": 82.9716,
  "address.coordinates.lng": 47.5946,
  "hobbies": ["teaching", "coding"]
}
*/
```

## Flattening an object with custom separator with array support

```javascript
/**
 * Advanced flatten with custom separator and array index notation
 * @param {Object} obj
 * @param {string} [separator='.']
 * @param {string} [parentKey='']
 * @returns {Object}
 */
function flatten(obj, separator = '.', parentKey = '') {
  const result = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    // Build current path
    const currentKey = parentKey ? `${parentKey}${separator}${key}` : key;
    const value = obj[key];

    if (value !== null && typeof value === 'object') {
      // Handle arrays with index notation: hobbies.0, hobbies.1, ...
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayKey = `${currentKey}${separator}${index}`;
          Object.assign(result, flatten(item, separator, arrayKey));
        });
      } else {
        // Regular nested object
        Object.assign(result, flatten(value, separator, currentKey));
      }
    } else {
      result[currentKey] = value;
    }
  }

  return result;
}

// ────────────────────────────────────────────────

const data = {
  user: {
    name: 'Jane Doe',
    tags: ['frontend', 'react', 'typescript'],
  },
  settings: {
    theme: 'dark',
    notifications: {
      email: true,
      sms: false,
    },
  },
};

console.log(flatten(data, ' → ')); // using → as separator for clarity
/* Output example:
{
  "user → name": "Jane Doe",
  "user → tags → 0": "frontend",
  "user → tags → 1": "react",
  "user → tags → 2": "typescript",
  "settings → theme": "dark",
  "settings → notifications → email": true,
  "settings → notifications → sms": false
}
*/
```

## Unflattening an object and rebuilding nested structure

```javascript
/**
 * Unflattens a flat object back to nested structure
 * @param {Object} flatObj - Flat object with dot notation keys
 * @param {string} [separator='.']
 * @returns {Object} Nested object
 */
function unflatten(flatObj, separator = '.') {
  // Final nested result object
  const result = {};

  // Process each flat key-value pair
  for (const flatKey in flatObj) {
    if (!Object.prototype.hasOwnProperty.call(flatObj, flatKey)) continue;

    // Get the value
    const value = flatObj[flatKey];

    // Split the key into parts (e.g. "a.b.c" → ["a", "b", "c"])
    const keys = flatKey.split(separator);

    // Current pointer that walks through the nested structure
    let current = result;

    // Process all parts except the last one
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];

      // If key doesn't exist yet, create object or array depending on next key
      const nextKey = keys[i + 1];
      const isNextNumeric = !isNaN(Number(nextKey)) && nextKey.trim() !== '';

      if (!(key in current)) {
        current[key] = isNextNumeric ? [] : {};
      }

      // Move pointer deeper
      current = current[key];
    }

    // Last key → set the actual value
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  return result;
}

// ────────────────────────────────────────────────

const flatData = {
  'profile.name': 'Mary',
  'profile.age': 32,
  'profile.skills.0': 'JavaScript',
  'profile.skills.1': 'Node.js',
  'config.api.timeout': 30000,
  'config.api.key': 'xyz123',
};

const nested = unflatten(flatData);

console.log(JSON.stringify(nested, null, 2));
/* Output:
{
  "profile": {
    "name": "Mary",
    "age": 32,
    "skills": [
      "JavaScript",
      "Node.js"
    ]
  },
  "config": {
    "api": {
      "timeout": 30000,
      "key": "xyz123"
    }
  }
}
*/
```

Use these helpers whenever you need to transform between nested and flat object representations in JavaScript — especially in frontend forms, backend APIs, configuration management, or database serialization.
