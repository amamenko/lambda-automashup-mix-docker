import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { createComplexFilter } from "./createComplexFilter";
import { checkFileExists } from "../utils/checkFileExists";
import { trimResultingMix } from "./trimResultingMix";
import { SongObj } from "./normalizeInputsAndMix";
import "dotenv/config";

export const OUTPUT_LOCATION =
  process.env.NODE_ENV === "production" ? "/tmp" : ".";

export const mixTracks = async (
  instrumentals: SongObj,
  vox: SongObj,
  accompanimentPath: string,
  voxPath: string
) => {
  const start = Date.now();

  const command = ffmpeg();

  const audioFiles = [
    accompanimentPath,
    ...Array(instrumentals.sections.length).fill(voxPath),
  ];

  audioFiles.forEach((fileName) => {
    command.input(fileName);
  });

  const fullComplexFilter = createComplexFilter(instrumentals, vox);

  if (fullComplexFilter && fullComplexFilter.length > 0) {
    const createOriginalMix = () => {
      return new Promise((resolve, reject) => {
        command
          .complexFilter(fullComplexFilter)
          .output(`${OUTPUT_LOCATION}/original_mix.mp3`)
          .on("error", async (err, stdout, stderr) => {
            const errorMessageStatement = `FFMPEG received an error when attempting to mix the instrumentals of the track "${instrumentals.title}" by ${instrumentals.artist} with the vocals of the track "${vox.title}" by ${vox.artist}. Terminating process. Output: `;
            const stdErrStatement = "FFMPEG stderr:\n" + stderr;
            console.error(`${errorMessageStatement} ${err.message}`);
            console.log(stdErrStatement);
            reject(errorMessageStatement);
            return errorMessageStatement;
          })
          .on("end", async () => {
            const doneStatement = `\nDone in ${
              (Date.now() - start) / 1000
            }s\nSuccessfully mixed the instrumentals of the track "${
              instrumentals.title
            }" by ${instrumentals.artist} with the vocals of the track "${
              vox.title
            }" by ${vox.artist}.\nSaved to${OUTPUT_LOCATION}/original_mix.mp3.`;

            console.log(doneStatement);
            resolve(doneStatement);

            return;
          })
          .run();
      });
    };
    return await createOriginalMix().then(
      async () => await trimResultingMix(instrumentals, vox)
    );
  } else {
    const noComplexFilterStatement = `No complex filter provided! Can't mix the instrumentals of the track "${instrumentals.title}" by ${instrumentals.artist} with the vocals of the track "${vox.title}" by ${vox.artist}. Moving on to next mix.`;
    console.log(noComplexFilterStatement);
    return noComplexFilterStatement;
  }
};
