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
