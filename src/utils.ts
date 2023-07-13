import { ResponseMessageType } from './types.js';

export const createResponse = <T>(type: ResponseMessageType, data: T): string => {
  return JSON.stringify({
    type,
    data: JSON.stringify(data),
    id: 0,
  });
};

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
