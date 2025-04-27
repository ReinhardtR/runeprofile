import { STATUS } from "~/lib/status";

export class RuneProfileError extends Error {
  status: (typeof STATUS)[keyof typeof STATUS];
  code: string;

  constructor(
    status: (typeof STATUS)[keyof typeof STATUS],
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "RuneProfileError";
    this.status = status;
    this.code = code;
  }
}

export const RuneProfileAccountNotFoundError = new RuneProfileError(
  STATUS.NOT_FOUND,
  "AccountNotFound",
  "Account not found.",
);

export const RuneProfileFailedToUploadFileError = new RuneProfileError(
  STATUS.INTERNAL_SERVER_ERROR,
  "FailedToUploadFile",
  "Failed to upload file.",
);

export const RuneProfileFailedToDeleteFileError = new RuneProfileError(
  STATUS.INTERNAL_SERVER_ERROR,
  "FailedToDeleteFile",
  "Failed to delete file.",
);

export const RuneProfileFileNotFoundError = new RuneProfileError(
  STATUS.NOT_FOUND,
  "FileNotFound",
  "File not found.",
);

export const RuneProfileHiscoresError = new RuneProfileError(
  STATUS.INTERNAL_SERVER_ERROR,
  "HiscoresError",
  "Failed to fetch hiscores.",
);

export const RuneProfileClogPageNotFoundError = new RuneProfileError(
  STATUS.NOT_FOUND,
  "CollectionLogPageNotFound",
  "The given page does not exist.",
);
