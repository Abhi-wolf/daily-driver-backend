// delayMiddleware.js
const delayMiddleware = (req, res, next) => {
  setTimeout(() => {
    next();
  }, 10000);
};

export default delayMiddleware;
