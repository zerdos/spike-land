import { describe, it, expect } from "vitest";
import { push, peek, pop } from "../core-logic/scheduler/SchedulerMinHeap.js";
import type { HeapNode } from "../core-logic/scheduler/SchedulerMinHeap.js";

function node(id: number, sortIndex: number): HeapNode {
  return { id, sortIndex };
}

describe("peek", () => {
  it("returns null for an empty heap", () => {
    expect(peek([])).toBeNull();
  });

  it("returns the root without removing it", () => {
    const heap: HeapNode[] = [];
    push(heap, node(1, 10));
    const top = peek(heap);
    expect(top?.id).toBe(1);
    expect(heap).toHaveLength(1); // still in heap
  });
});

describe("push + pop — min-heap ordering", () => {
  it("pop from a single-element heap returns that element", () => {
    const heap: HeapNode[] = [];
    push(heap, node(1, 5));
    const result = pop(heap);
    expect(result?.id).toBe(1);
    expect(heap).toHaveLength(0);
  });

  it("pop from an empty heap returns null", () => {
    expect(pop([])).toBeNull();
  });

  it("pops elements in ascending sortIndex order", () => {
    const heap: HeapNode[] = [];
    push(heap, node(1, 30));
    push(heap, node(2, 10));
    push(heap, node(3, 20));

    expect(pop(heap)?.sortIndex).toBe(10);
    expect(pop(heap)?.sortIndex).toBe(20);
    expect(pop(heap)?.sortIndex).toBe(30);
  });

  it("uses id as a tiebreaker when sortIndex values are equal", () => {
    const heap: HeapNode[] = [];
    push(heap, node(3, 10));
    push(heap, node(1, 10));
    push(heap, node(2, 10));

    // Lower id should come first
    expect(pop(heap)?.id).toBe(1);
    expect(pop(heap)?.id).toBe(2);
    expect(pop(heap)?.id).toBe(3);
  });

  it("handles insertion order independence", () => {
    const heap: HeapNode[] = [];
    // Insert in reverse order
    for (let i = 10; i >= 1; i--) {
      push(heap, node(i, i));
    }

    const result: number[] = [];
    while (heap.length > 0) {
      const n = pop(heap);
      if (n) result.push(n.sortIndex);
    }
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("peek always reflects the current minimum", () => {
    const heap: HeapNode[] = [];
    push(heap, node(1, 50));
    expect(peek(heap)?.sortIndex).toBe(50);

    push(heap, node(2, 10));
    expect(peek(heap)?.sortIndex).toBe(10);

    pop(heap);
    expect(peek(heap)?.sortIndex).toBe(50);
  });
});
