import ffmpeg from "fluent-ffmpeg";
import { getClosestBeatArr } from "./getClosestBeatArr";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { addMixToContentful } from "../contentful/addMixToContentful";
import { SongObj } from "./normalizeInputsAndMix";
import { OUTPUT_LOCATION } from "./mixTracks";
import "dotenv/config";

export const trimResultingMix = async (
  instrumentals: SongObj,
  vocals: SongObj
) => {
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
        ffmpeg(`${OUTPUT_LOCATION}/original_mix.mp3`)
          .output(`${OUTPUT_LOCATION}/trimmed_mix.mp3`)
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
            reject(`${errorMessageStatement} ${err.message}`);
            return `${errorMessageStatement} ${err.message}`;
          })
          .on("end", async () => {
            const successStatement = `\nDone in ${
              (Date.now() - start) / 1000
            }s\nSuccessfully trimmed original MP3 file.\nSaved to ${OUTPUT_LOCATION}/trimmed_mix.mp3.`;
            console.log(successStatement);
            const mp3Duration = (await getAudioDurationInSeconds(
              `${OUTPUT_LOCATION}/trimmed_mix.mp3`
            ).catch((err) => {
              const errorStatement = `Received error when attempting to get audio duration of ${OUTPUT_LOCATION}/trimmed_mix.mp3 in seconds: ${err}`;
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
    const noSectionsAvailableStatement = "No instrumental sections available!";
    console.log(noSectionsAvailableStatement);
    return noSectionsAvailableStatement;
  }
};
