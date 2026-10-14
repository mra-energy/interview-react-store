export type Store<T> = {
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<T extends object>(initial: T): Store<T> {
  void initial;
  throw new Error("Not implemented");
}

export function useStore<T extends object, U>(
  store: Store<T>,
  selector: (state: T) => U,
  isEqual?: (a: U, b: U) => boolean,
): U {
  void store;
  void selector;
  void isEqual;
  throw new Error("Not implemented");
}

export function shallow<T>(a: T, b: T): boolean {
  void a;
  void b;
  throw new Error("Not implemented");
}
