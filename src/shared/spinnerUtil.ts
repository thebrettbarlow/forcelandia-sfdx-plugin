const doneInSeconds = (start: number, end: number): string => {
  return `done in ${((end - start) * 0.001).toFixed(3)} seconds`;
};

export { doneInSeconds }
