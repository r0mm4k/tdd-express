class ValidationException {
  constructor(errors) {
    this.status = 400;
    this.errors = errors;
  }
}

module.exports = ValidationException;
