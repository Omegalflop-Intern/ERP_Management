export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
