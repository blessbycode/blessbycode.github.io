---
title: 'Create Full Pyramid in Python'
published: 2026-02-02
draft: false
description: 'Learn how to create a full pyramid shape using loops in python, which is a very common and important question in python interviews.'
toc: false
tags: ['python', 'interview question']
icons: ['python']
tech: 'python'
---

## How to make a Full Pyramid

Pyramid are sequences of characters shaped in form of Equilateral Triangle which is equal from all sides.

So let's jump to the code and see how we can do it.

### Method 1 (Single Loop)

```python
def full_pyramid(rows):
    for i in range(1, rows + 1):
        print(' ' * (rows - i) + '*' * (2 * i - 1))

full_pyramid(5)
```

![Output](./Output.png)

### Method 2 (Multi Loop)

```python
def full_pyramid(rows):
    for i in range(1,rows):
        for j in range(rows-i):
            print(" ", end="")
        for k in range(2 * i - 1):
            print('*', end="")
        print()

full_pyramid(7)
```

![Output](./Output.png)

### Method 3 (List Comprehension)

```python
def full_pyramid(rows):
    pattern = [' ' * (rows - i) + '*' * (2 * i - 1) for i in range(1, rows + 1)]
    print('\n'.join(pattern))

full_pyramid(7)
```

### Method 3 (Recursion)

```python

def full_pyramid(rows, i=1):
    if i > rows:
        return
    print(' ' * (rows - i) + '*' * (2 * i - 1))
    full_pyramid(rows, i + 1)

full_pyramid(7)

```

![Output](./Output.png)
