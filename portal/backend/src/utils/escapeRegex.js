/** Escapes user input before it is used inside a MongoDB $regex query. */
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default escapeRegex;
