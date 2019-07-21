export const validateEitherFlagIsSet = (flags: any, firstFlag: string, secondFlag: string) => {
  if ((!flags[firstFlag] && !flags[secondFlag]) ||
    (flags[firstFlag] && flags[secondFlag])) {

    throw new Error(`Either --${firstFlag} OR --${secondFlag} must be set`);

  }
};
