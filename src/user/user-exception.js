class InvalidTokenException {
  constructor() {
    this.status = 400;
    this.message = "accountActivationFailure";
  }
}

module.exports = InvalidTokenException;
