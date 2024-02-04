import ApiError from "../utils/ApiError.js";

export const notFoundMiddleware = async (req, res, next) => {
  return next(new ApiError(404, "Sorry!!! Invalid URL!!!"));
};
