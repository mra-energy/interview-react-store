import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createStore, useStore, type Store } from "../store";

type State = { count: number; name: string; items: string[] };

const make = () =>
  createStore<State>({ count: 0, name: "ada", items: ["a", "b", "c"] });

const countRenders = vi.fn();
const nameRenders = vi.fn();

function Count({ store }: { store: Store<State> }) {
  countRenders();
  const count = useStore(store, (s) => s.count);
  return <p>count: {count}</p>;
}

function Name({ store }: { store: Store<State> }) {
  nameRenders();
  const name = useStore(store, (s) => s.name);
  return <p>name: {name}</p>;
}

describe("stage 2: hook", () => {
  it("renders the selected slice", () => {
    render(<Count store={make()} />);
    expect(screen.getByText("count: 0")).toBeTruthy();
  });

  it("re-renders when the selected slice changes", () => {
    const store = make();
    render(<Count store={store} />);

    act(() => store.setState({ count: 1 }));
    expect(screen.getByText("count: 1")).toBeTruthy();

    act(() => store.setState((s) => ({ count: s.count + 1 })));
    expect(screen.getByText("count: 2")).toBeTruthy();
  });

  it("does not re-render when an unrelated slice changes", () => {
    const store = make();
    nameRenders.mockClear();
    render(<Name store={store} />);
    expect(nameRenders).toHaveBeenCalledTimes(1);

    act(() => store.setState({ count: 1 }));
    act(() => store.setState({ items: [] }));
    expect(nameRenders).toHaveBeenCalledTimes(1);
    expect(screen.getByText("name: ada")).toBeTruthy();
  });

  it("several components reading the same store all stay in sync", () => {
    const store = make();
    render(
      <>
        <Count store={store} />
        <Count store={store} />
        <Name store={store} />
      </>,
    );

    act(() => store.setState({ count: 5, name: "grace" }));
    expect(screen.getAllByText("count: 5")).toHaveLength(2);
    expect(screen.getByText("name: grace")).toBeTruthy();
  });

  it("an inline selector does not resubscribe on every render", () => {
    const store = make();
    const subscribe = vi.fn(store.subscribe);
    const spied: Store<State> = { ...store, subscribe };

    function Parent() {
      const [tick, setTick] = useState(0);
      const count = useStore(spied, (s) => s.count);
      return (
        <button onClick={() => setTick(tick + 1)}>
          tick {tick}, count {count}
        </button>
      );
    }

    render(<Parent />);
    const subscriptionsAfterMount = subscribe.mock.calls.length;
    expect(subscriptionsAfterMount).toBeGreaterThan(0);

    const button = screen.getByRole("button");
    act(() => button.click());
    act(() => button.click());
    act(() => button.click());
    expect(screen.getByText("tick 3, count 0")).toBeTruthy();
    expect(subscribe).toHaveBeenCalledTimes(subscriptionsAfterMount);
  });

  it("unmounting unsubscribes", () => {
    const store = make();
    let active = 0;
    const spied: Store<State> = {
      ...store,
      subscribe: (listener) => {
        active += 1;
        const unsubscribe = store.subscribe(listener);
        return () => {
          active -= 1;
          unsubscribe();
        };
      },
    };

    const { unmount } = render(<Count store={spied} />);
    expect(active).toBeGreaterThan(0);
    unmount();
    expect(active).toBe(0);
  });

  it("a selector may depend on props: re-rendering with new props re-selects", () => {
    const store = make();
    function Item({ index }: { index: number }) {
      const item = useStore(store, (s) => s.items[index]);
      return <p>item: {item}</p>;
    }

    const { rerender } = render(<Item index={0} />);
    expect(screen.getByText("item: a")).toBeTruthy();

    rerender(<Item index={2} />);
    expect(screen.getByText("item: c")).toBeTruthy();

    act(() => store.setState({ items: ["x", "y", "z"] }));
    expect(screen.getByText("item: z")).toBeTruthy();
  });
});
