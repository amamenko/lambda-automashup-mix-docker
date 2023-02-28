import fs from "fs";

export const checkFileExists = async (file: string) => {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
};
