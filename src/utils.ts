export const parseString = (str: string): any => {
  try {
    return JSON.parse(str, (_, nested) => {
      if (typeof nested === 'string') return parseString(nested);
      return nested;
    });
  } catch (err) {
    return str;
  }
};
