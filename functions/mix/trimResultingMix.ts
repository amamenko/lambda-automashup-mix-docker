import ffmpeg from "fluent-ffmpeg";
import { checkFileExists } from "../utils/checkFileExists";
import { getClosestBeatArr } from "./getClosestBeatArr";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { addMixToContentful } from "../contentful/addMixToContentful";
import { checkExistsAndDelete } from "../utils/checkExistsAndDelete";
import { SongObj } from "./normalizeInputsAndMix";
import "dotenv/config";

export const trimResultingMix = async (
  instrumentals: SongObj,
  vocals: SongObj
) => {
  const mp3Exists = await checkFileExists("original_mix.mp3");

  if (mp3Exists) {
    if (instrumentals) {
      instrumentals.currentSection = "accompaniment";

      const instrumentalSections = instrumentals.sections
        .map(getClosestBeatArr, instrumentals)
        .filter(
          (item) =>
            !item.sectionName.includes("intro") &&
            !item.sectionName.includes("outro")
        );

      const mixStart = instrumentalSections[0].start;
      const mixLastSection = instrumentalSections.find(
        (section) => section.start - mixStart >= 75
      );
      const mixEnd = mixLastSection
        ? mixLastSection.start
        : instrumentalSections[instrumentalSections.length - 1].start;

      const allBeats =
        typeof instrumentals.beats === "string"
          ? instrumentals.beats.split(", ")
          : instrumentals.beats;

      const indexOfFirstBeat = allBeats.findIndex((beat) => beat === mixStart);
      const introStartBeat =
        indexOfFirstBeat >= 16
          ? allBeats[indexOfFirstBeat - 16]
          : allBeats[indexOfFirstBeat];

      const outroStartIndex = allBeats.findIndex((beat) => beat === mixEnd);
      const outroEnd = allBeats[outroStartIndex + 16]
        ? allBeats[outroStartIndex + 16]
        : allBeats[allBeats.length - 1];

      const start = Date.now();

      const introDuration = mixStart - Number(introStartBeat);
      const mainMixDuration = mixEnd - mixStart;
      const outroDelay = (introDuration + mainMixDuration) * 1000;

      const createTrimmedMix = () => {
        return new Promise((resolve, reject) => {
          ffmpeg("original_mix.mp3")
            .output("./trimmed_mix.mp3")
            .complexFilter([
              {
                filter: `atrim=start=${introStartBeat}:end=${outroEnd}`,
                inputs: "0:a",
                outputs: "main_trim",
              },
              {
                filter: "asetpts=PTS-STARTPTS",
                inputs: "main_trim",
                outputs: "main_0",
              },
              {
                filter: "volume=4",
                inputs: "main_0",
                outputs: "main",
              },
              {
                filter: `afade=t=out:st=${Number(outroEnd) - 10}:d=10`,
                inputs: "main",
                outputs: "main_fade_out",
              },
              {
                filter: "loudnorm=tp=-9:i=-33",
                inputs: "main_fade_out",
                outputs: "main_normalized",
              },
              {
                filter: `afade=t=in:st=0:d=${introDuration}`,
                inputs: "main_normalized",
              },
            ])
            .on("error", async (err, stdout, stderr) => {
              const errorMessageStatement = `FFMPEG received an error. Terminating process. Output: `;
              const stdErrStatement = "FFMPEG stderr:\n" + stderr;
              console.error(`${errorMessageStatement} ${err.message}`);
              console.error(stdErrStatement);

              await checkExistsAndDelete("./functions/mix/inputs");
              await checkExistsAndDelete("original_mix.mp3");
              await checkExistsAndDelete("trimmed_mix.mp3");

              reject(`${errorMessageStatement} ${err.message}`);
              return `${errorMessageStatement} ${err.message}`;
            })
            .on("end", async () => {
              const successStatement = `\nDone in ${
                (Date.now() - start) / 1000
              }s\nSuccessfully trimmed original MP3 file.\nSaved to trimmed_mix.mp3.`;
              console.log(successStatement);

              await checkExistsAndDelete("./functions/mix/inputs");
              await checkExistsAndDelete("original_mix.mp3");

              const mp3Duration = (await getAudioDurationInSeconds(
                "trimmed_mix.mp3"
              ).catch((err) => {
                const errorStatement = `Received error when attempting to get audio duration of trimmed_mix.mp3 in seconds: ${err}`;
                console.error(errorStatement);
                return errorStatement;
              })) as number;

              resolve(mp3Duration);
              resolve(true);
              return;
            })
            .run();
        });
      };
      return await createTrimmedMix().then(async (mp3Duration: number) => {
        if (typeof mp3Duration === "number") {
          return await addMixToContentful(
            instrumentals,
            vocals,
            mp3Duration,
            introDuration,
            outroDelay / 1000
          );
        } else {
          return mp3Duration;
        }
      });
    } else {
      const noSectionsAvailableStatement =
        "No instrumental sections available!";
      console.log(noSectionsAvailableStatement);
      return noSectionsAvailableStatement;
    }
  } else {
    const noFileAvailableStatement =
      "No original_mix.mp3 file available to trim!";

    console.log(noFileAvailableStatement);
    return noFileAvailableStatement;
  }
};
