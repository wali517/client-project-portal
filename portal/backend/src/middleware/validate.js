import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

const validate =
  (schemas = {}) =>
  (req, _res, next) => {
    try {
      for (const key of ["body", "query", "params"]) {
        if (!schemas[key]) continue;
        const parsed = schemas[key].parse(req[key]);
        if (key === "query") {
          Object.defineProperty(req, "validatedQuery", {
            value: parsed,
            writable: true,
            configurable: true,
          });
          req.query = parsed;
        } else {
          req[key] = parsed;
        }
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return next(ApiError.unprocessable("Validation failed", errors));
      }
      return next(error);
    }
  };

export default validate;
