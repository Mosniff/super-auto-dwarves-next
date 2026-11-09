// Returns an integer from 0 to optionCount - 1; injected so pure code never
// calls a random source.
export type ChooseRandomIndex = (optionCount: number) => number;
