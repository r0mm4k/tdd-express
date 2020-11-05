class EmailException {
  constructor() {
    this.status = 502;
    this.message = "emailFailure";
  }
}

module.exports = EmailException;
