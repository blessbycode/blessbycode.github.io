---
title: 'Create Half Pyramid in Python'
published: 2026-02-02
draft: false
description: 'Learn how to create a half pyramid shape using loops in python, which is a very common and important question in python interviews.'
toc: false
tags: ['python', 'interview question']
icons: ['python']
tech: 'python'
---

## How to make a Half Pyramid

Pyramid are sequences of characters shaped in form of Equilateral Triangle which is equal from all sides.

Half Pyramid one sided part of Pyramid and it is in shape of a Right Angle Triangle.

So let's jump to the code and see how we can do it.

### Method 1 (Single Loop)

```python
def half_pyramid(rows):
    for i in range(1, rows+1):
        print(i * ("*"), end = "\n")

half_pyramid(7)
```

![Output](./Output.png)

### Method 2 (Multi Loop)

```python
def half_pyramid(rows):
    for i in range(1, rows):
        for j in range(i):
            print('*', end="")
        print()

half_pyramid(7)
```

![Output](./Output.png)

### Method 3 (Recursion)

```python

def half_pyramid(rows):
    if rows > 0:
        half_pyramid(rows - 1)

        print("*" * rows)

half_pyramid(7)
```

![Output](./Output.png)
