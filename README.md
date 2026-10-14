# Ecair React Interview: a mini store

This is our technical interview for front-end people. You will build a small
external store and a React hook that subscribes to it, in the spirit of
[Zustand](https://github.com/pmndrs/zustand).

Getting it working takes about 40 lines. Getting it correct takes understanding
how React subscribes to things that live outside of it.

## Rules

- Build the hook on [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore).
  Read the docs, they are the main resource for this exercise.
- Documentation is allowed. Reading the source code of state libraries is not.
- The tests are the brief. Work through them stage by stage; each stage builds on
  the previous one.

## Setup

```sh
npm install
npx vitest            # watch mode, re-runs on save
npx vitest 1-store    # only one stage
npm run dev           # a small playground in the browser, works once stage 2 is done
```

## The API

Everything lives in [`src/store.ts`](src/store.ts):

```ts
export function createStore<T extends object>(initial: T): Store<T>;
// getState(): T
// setState(partial: Partial<T> | ((state: T) => Partial<T>)): void
// subscribe(listener: () => void): () => void

export function useStore<T extends object, U>(
  store: Store<T>,
  selector: (state: T) => U,
  isEqual?: (a: U, b: U) => boolean,
): U;

export function shallow<T>(a: T, b: T): boolean;
```

## Stages

### 1. Store ([`1-store.test.ts`](src/stages/1-store.test.ts))

`setState` accepts a partial or an updater, `subscribe` returns an unsubscribe
function. Setting a value equal to the current one notifies no one. A listener
may unsubscribe itself, or another listener, while listeners are being notified.

### 2. Hook ([`2-hook.test.tsx`](src/stages/2-hook.test.tsx))

A component re-renders only when its selected slice changes: updating `count`
must not re-render a component reading `name`. An inline selector such as
`(s) => s.count` must not cause a resubscribe on every render. A selector may
close over props.

### 3. Derived selectors ([`3-derived.test.tsx`](src/stages/3-derived.test.tsx))

```ts
const { a, b } = useStore(store, (s) => ({ a: s.a, b: s.b }), shallow);
```

Write `shallow`, then make selectors that return a fresh object or array work
when given an equality function. The component must not re-render when the
selection is shallow-equal to the previous one, and the selected value must keep
its identity until the selection actually changes.

## Resources

- [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)
- [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
