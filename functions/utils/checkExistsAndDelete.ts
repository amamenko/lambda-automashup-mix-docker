import fs from "fs";
import { checkFileExists } from "./checkFileExists";
import "dotenv/config";

export const checkExistsAndDelete = async (filename: string) => {
  const fileExists = await checkFileExists(filename);

  if (fileExists) {
    fs.rm(
      filename,
      {
        recursive: true,
        force: true,
      },
      () => {
        const deletedStatement = `${filename} file deleted!`;
        console.log(deletedStatement);
      }
    );
  }
};
