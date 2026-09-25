import Counter from "../models/Counter.js";

const pad = (num, width = 6) => String(num).padStart(width, "0");
export const nextSequence = async (prefix, year = new Date().getFullYear()) => {
  const key = `${prefix}-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return `${prefix}-${year}-${pad(counter.seq)}`;
};

export const generateRequestNumber = () => nextSequence("REQ");
export const generateProjectNumber = () => nextSequence("PRJ");
