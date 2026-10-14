import { describe, expect, it, vi } from "vitest";
import { createStore } from "../store";

const make = () => createStore({ count: 0, name: "ada" });

describe("stage 1: store", () => {
  it("getState returns the initial state", () => {
    expect(make().getState()).toEqual({ count: 0, name: "ada" });
  });

  it("setState merges a partial into the state", () => {
    const store = make();
    store.setState({ count: 1 });
    expect(store.getState()).toEqual({ count: 1, name: "ada" });
  });

  it("setState accepts an updater that receives the current state", () => {
    const store = make();
    store.setState((s) => ({ count: s.count + 1 }));
    store.setState((s) => ({ count: s.count + 1 }));
    expect(store.getState().count).toBe(2);
  });

  it("setState never mutates a previously returned state object", () => {
    const store = make();
    const before = store.getState();
    store.setState({ count: 1 });
    expect(before.count).toBe(0);
    expect(store.getState()).not.toBe(before);
  });

  it("subscribe notifies on change, and the returned function unsubscribes", () => {
    const store = make();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setState({ count: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("setting a value equal to the current one does not notify", () => {
    const store = make();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState({ count: 0 });
    store.setState({ name: "ada" });
    store.setState((s) => ({ count: s.count }));
    expect(listener).not.toHaveBeenCalled();

    store.setState({ count: 0, name: "grace" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("a listener can unsubscribe itself while listeners are notified", () => {
    const store = make();
    const first = vi.fn(() => unsubscribeFirst());
    const second = vi.fn();
    const unsubscribeFirst = store.subscribe(first);
    store.subscribe(second);

    store.setState({ count: 1 });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    store.setState({ count: 2 });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it("a listener can unsubscribe another listener while listeners are notified", () => {
    const store = make();
    const first = vi.fn(() => unsubscribeSecond());
    const second = vi.fn();
    store.subscribe(first);
    const unsubscribeSecond = store.subscribe(second);

    store.setState({ count: 1 });
    const secondCallsAfterFirstUpdate = second.mock.calls.length;

    store.setState({ count: 2 });
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(secondCallsAfterFirstUpdate);
  });
});
