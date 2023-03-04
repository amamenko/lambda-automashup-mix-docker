import { findMatchingSongs } from "../match/findMatchingSongs";
import { normalizeInputsAndMix } from "./normalizeInputsAndMix";
import { delayExecution } from "../utils/delayExecution";
import { getUniqueOnly } from "../utils/getUniqueOnly";
import { addMashupPositionValue } from "../contentful/addMashupPositionValue";
import { updateMixLoopInProgress } from "../contentful/updateMixLoopInProgress";
import { logger } from "../../logger/logger";
import { getMixList } from "../contentful/getMixList";
import { getMixSongEntries } from "../contentful/getMixSongEntries";
import { getMashupEntries } from "../contentful/getMashupEntries";
import "dotenv/config";

export const createMashup = async () => {
  const errorLog = (err: any) => {
    const errorStatement = `Received error when attempting to get individual song entries to create a new mashup entry: ${err}`;
    if (process.env.NODE_ENV === "production") {
      logger("server").error(errorStatement);
    } else {
      console.error(err);
    }
    return errorStatement;
  };

  const mixListItems = await getMixList().catch((e) => errorLog(e));
  if (mixListItems) {
    const inProgressChart = mixListItems.find(
      (item: any) => item.fields.loopInProgress === true
    ) as { [key: string]: any };
    if (inProgressChart && inProgressChart.fields.mashups) {
      const notMixedYet = inProgressChart.fields.mashups.filter(
        (item: { [key: string]: boolean }) => !item.mixed
      );
      const otherChart = mixListItems.find(
        (item) => item.sys.id !== inProgressChart.sys.id
      );
      const currentIndex = inProgressChart.fields.currentLoopPosition
        ? inProgressChart.fields.currentLoopPosition
        : 0;
      const lastMashupListIndex = notMixedYet.length - 1;
      const mashupListID = inProgressChart.sys.id;
      if (currentIndex === 0 && currentIndex !== lastMashupListIndex) {
        addMashupPositionValue(mashupListID, currentIndex);
      }

      if (currentIndex === lastMashupListIndex) {
        await updateMixLoopInProgress(mashupListID, "done").then(async () => {
          // If major mix chart is done, move on to minor mixes
          if (inProgressChart.fields.title.toLowerCase().includes("major")) {
            if (otherChart) {
              await updateMixLoopInProgress(otherChart.sys.id, "in progress");
            }
          }
        });
      } else {
        if (currentIndex !== 0) {
          await addMashupPositionValue(mashupListID, currentIndex);
        }
      }

      await delayExecution(1000);

      const currentSongs = notMixedYet[currentIndex];
      const currentIDs = currentSongs
        ? currentSongs.accompanimentID + "," + currentSongs.vocalsID
        : "";

      const songEntries = await getMixSongEntries(currentIDs).catch((e) =>
        errorLog(e)
      );

      if (songEntries) {
        if (songEntries.length === 2) {
          const matches = findMatchingSongs(songEntries);
          let filteredMatches = matches.filter(
            (item: { [key: string]: any }) =>
              item.accompaniment.sys.id === currentSongs.accompanimentID &&
              item.vocals.sys.id === currentSongs.vocalsID
          );

          filteredMatches = getUniqueOnly(filteredMatches);

          if (filteredMatches && filteredMatches[0]) {
            const bothSections = filteredMatches[0];
            const doesMashupAlreadyExist = await getMashupEntries(
              currentSongs
            ).catch((e) => errorLog(e));

            // Check for existing mashup just in case
            if (doesMashupAlreadyExist && doesMashupAlreadyExist.length === 0) {
              const matchedAccompanimentSections =
                currentSongs.accompanimentSections.split(", ");

              bothSections.accompaniment.fields.id =
                currentSongs.accompanimentID;
              bothSections.accompaniment.fields.sections =
                bothSections.accompaniment.fields.sections.filter(
                  (item: { [key: string]: string }) =>
                    matchedAccompanimentSections.includes(item.sectionName)
                );
              bothSections.vocals.fields.id = currentSongs.vocalsID;
              bothSections.vocals.fields.keyScaleFactor =
                currentSongs.vocalsKeyScaleFactor;
              bothSections.vocals.fields.tempoScaleFactor =
                currentSongs.vocalsTempoScaleFactor;

              return await normalizeInputsAndMix(
                bothSections.accompaniment.fields,
                bothSections.vocals.fields
              );
            } else {
              const alreadyExistsStatement = `The mashup with accompaniment track "${currentSongs.accompanimentTitle}" by ${currentSongs.accompanimentArtist} mixed with the vocal track "${currentSongs.vocalsTitle}" by ${currentSongs.vocalsArtist} already exists! Moving on to next mashup.`;
              if (process.env.NODE_ENV === "production") {
                logger("server").info(alreadyExistsStatement);
              } else {
                console.log(alreadyExistsStatement);
              }
              return alreadyExistsStatement;
            }
          }
        } else {
          const missingEntryStatement = `Can't find one or both song entries when trying to create a mashup with accompaniment track "${currentSongs.accompanimentTitle}" by ${currentSongs.accompanimentArtist} and vocal track "${currentSongs.vocalsTitle}" by ${currentSongs.vocalsArtist}. Moving on to next mashup.`;

          if (process.env.NODE_ENV === "production") {
            logger("server").info(missingEntryStatement);
          } else {
            console.log(missingEntryStatement);
          }
          return missingEntryStatement;
        }
      } else {
        return "Couldn't get song entries!";
      }
    } else {
      return "Couldn't get in progress chart!";
    }
  } else {
    return "No mix list items found!";
  }
};
