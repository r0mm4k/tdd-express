// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const { status, message, errors } = err;
  res.status(status).send({ message: req.t(message), errors });
};
