// delayMiddleware.js
const delayMiddleware = (req, res, next) => {
  setTimeout(() => {
    next();
  }, 100);
};

export default delayMiddleware;
