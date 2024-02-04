const errorMiddleware = (error, req, res, next) => {
  error.message = error.message || "Internal Server Error";
  error.statusCode = error.statusCode || 500;

  res.status(error.statusCode).json({
    message: error.message,
    success: false,
  });
};

export default errorMiddleware;
