export class AccountNotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class AccountNotFoundByHashError extends AccountNotFoundError {
  constructor(accountHash: string) {
    super(`Account with hash ${accountHash} not found`);
  }
}

export class AccountNotFoundByUsernameError extends AccountNotFoundError {
  constructor(username: string) {
    super(`Account with username ${username} not found`);
  }
}

export class AccountNotFoundByGeneratedUrlPath extends AccountNotFoundError {
  constructor(generatedUrlPath: string) {
    super(`Account with generatedUrlPath ${generatedUrlPath} not found`);
  }
}

export class AccountIsPrivateError extends Error {
  constructor(username: string) {
    super(`Account with username ${username} is private`);
  }
}
