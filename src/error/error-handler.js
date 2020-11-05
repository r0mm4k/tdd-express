// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const { status, message, errors } = err;
  res.status(status).send({
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: req.t(message),
    errors,
  });
};
