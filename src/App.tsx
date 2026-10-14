import { useRef } from "react";
import { createStore, useStore } from "./store";

// A small playground for the store. It only works once stage 2 is done.
const store = createStore({ count: 0, name: "ada" });

function useRenderCount() {
  const renders = useRef(0);
  renders.current += 1;
  return renders.current;
}

function Counter() {
  const count = useStore(store, (s) => s.count);
  const renders = useRenderCount();
  return (
    <p>
      count: {count} <small>(rendered {renders}x)</small>{" "}
      <button onClick={() => store.setState((s) => ({ count: s.count + 1 }))}>
        +1
      </button>
    </p>
  );
}

function Name() {
  const name = useStore(store, (s) => s.name);
  const renders = useRenderCount();
  return (
    <p>
      name:{" "}
      <input
        value={name}
        onChange={(e) => store.setState({ name: e.target.value })}
      />{" "}
      <small>(rendered {renders}x)</small>
    </p>
  );
}

export function App() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h1>Mini store</h1>
      <Counter />
      <Name />
    </div>
  );
}
