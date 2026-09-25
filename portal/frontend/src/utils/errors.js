export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((item) => item.message || item).join(' ');
  }
  return data.message || error?.message || fallback;
};

export const getFieldErrors = (error) => {
  const errors = error?.response?.data?.errors;
  if (!Array.isArray(errors)) return {};
  return errors.reduce((acc, item) => {
    if (item.field) acc[item.field] = item.message;
    return acc;
  }, {});
};
