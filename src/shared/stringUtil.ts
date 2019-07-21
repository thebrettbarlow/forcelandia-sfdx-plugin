// escaping single and double quotes based on: https://stackoverflow.com/questions/770523/escaping-strings-in-javascript
const escapeQuotes = (string: string): string => {
  return string.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
};

export { escapeQuotes }
