import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createStore, shallow, useStore } from "../store";

type Todo = { text: string; done: boolean };
type State = { count: number; name: string; todos: Todo[] };

const make = () =>
  createStore<State>({
    count: 0,
    name: "ada",
    todos: [
      { text: "write store", done: true },
      { text: "write hook", done: false },
    ],
  });

describe("stage 3: shallow", () => {
  it("compares primitives with Object.is", () => {
    expect(shallow(1, 1)).toBe(true);
    expect(shallow("a", "b")).toBe(false);
    expect(shallow(NaN, NaN)).toBe(true);
    expect(shallow(null, null)).toBe(true);
    expect(shallow<unknown>(null, {})).toBe(false);
  });

  it("compares objects one level deep", () => {
    expect(shallow({ a: 1, b: "x" }, { a: 1, b: "x" })).toBe(true);
    expect(shallow({ a: 1 }, { a: 2 })).toBe(false);
    expect(shallow<object>({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallow<object>({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(shallow<object>({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("does not compare nested values deeply", () => {
    const nested = { x: 1 };
    expect(shallow({ a: nested }, { a: nested })).toBe(true);
    expect(shallow({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
  });

  it("compares arrays element by element", () => {
    expect(shallow([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(shallow([1, 2], [1, 2, 3])).toBe(false);
    expect(shallow([{ a: 1 }], [{ a: 1 }])).toBe(false);
  });
});

describe("stage 3: derived selectors", () => {
  const summaryRenders = vi.fn();

  function Summary({ store }: { store: ReturnType<typeof make> }) {
    summaryRenders();
    const { count, name } = useStore(
      store,
      (s) => ({ count: s.count, name: s.name }),
      shallow,
    );
    return (
      <p>
        {name}: {count}
      </p>
    );
  }

  it("a selector returning a fresh object does not loop when given an equality function", () => {
    render(<Summary store={make()} />);
    expect(screen.getByText("ada: 0")).toBeTruthy();
  });

  it("re-renders when a selected key changes", () => {
    const store = make();
    render(<Summary store={store} />);

    act(() => store.setState({ count: 3 }));
    expect(screen.getByText("ada: 3")).toBeTruthy();

    act(() => store.setState({ name: "grace" }));
    expect(screen.getByText("grace: 3")).toBeTruthy();
  });

  it("does not re-render when the selection is equal after an unrelated change", () => {
    const store = make();
    summaryRenders.mockClear();
    render(<Summary store={store} />);
    expect(summaryRenders).toHaveBeenCalledTimes(1);

    act(() => store.setState({ todos: [] }));
    act(() =>
      store.setState((s) => ({
        todos: s.todos.concat({ text: "x", done: false }),
      })),
    );
    expect(summaryRenders).toHaveBeenCalledTimes(1);
  });

  it("the selected value keeps its identity until the selection changes", () => {
    const store = make();
    const seen: unknown[] = [];

    function Capture({ label }: { label: string }) {
      const selected = useStore(
        store,
        (s) => ({ count: s.count, name: s.name }),
        shallow,
      );
      seen.push(selected);
      return <p>{label}</p>;
    }

    const { rerender } = render(<Capture label="one" />);
    rerender(<Capture label="two" />);
    act(() => store.setState({ todos: [] }));
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(new Set(seen).size).toBe(1);

    act(() => store.setState({ count: 1 }));
    expect(seen.at(-1)).toEqual({ count: 1, name: "ada" });
    expect(seen.at(-1)).not.toBe(seen[0]);
  });

  it("a selector deriving a new array works with shallow", () => {
    const store = make();
    const doneRenders = vi.fn();

    function Done() {
      doneRenders();
      const done = useStore(
        store,
        (s) => s.todos.filter((t) => t.done),
        shallow,
      );
      return <p>done: {done.map((t) => t.text).join(", ")}</p>;
    }

    render(<Done />);
    expect(screen.getByText("done: write store")).toBeTruthy();
    expect(doneRenders).toHaveBeenCalledTimes(1);

    act(() => store.setState({ count: 42 }));
    act(() => store.setState({ name: "grace" }));
    expect(doneRenders).toHaveBeenCalledTimes(1);

    act(() =>
      store.setState((s) => ({
        todos: s.todos.map((t) => ({ ...t, done: true })),
      })),
    );
    expect(screen.getByText("done: write store, write hook")).toBeTruthy();
  });
});
