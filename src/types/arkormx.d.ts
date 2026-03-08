declare module 'arkormx' {
  class ArkormCollection<T = any, X = T[]> {
    constructor(collection?: Record<string, T> | T[] | T | X)
    all(): X
  }
}

export {}
