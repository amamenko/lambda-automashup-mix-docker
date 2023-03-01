import fs from "fs";
import { checkFileExists } from "../utils/checkFileExists";
import { createClient } from "contentful-management";
import { logger } from "../../logger/logger";
import "dotenv/config";
import { APIGatewayProxyCallback } from "aws-lambda";

interface SongObj {
  id: string;
  title: string;
  artist: string;
  mode: string;
}

export const addMixToContentful = async (
  callback: APIGatewayProxyCallback,
  accompaniment: SongObj,
  vocals: SongObj,
  mp3Duration: number,
  mixStart: number,
  mixEnd: number
) => {
  // Access to Contentful's Content Management API
  const client = createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN as string,
  });

  const mixExists = await checkFileExists("trimmed_mix.mp3");

  const deleteTrimmedMix = async () => {
    if (await checkFileExists("trimmed_mix.mp3")) {
      fs.rm(
        "trimmed_mix.mp3",
        {
          recursive: true,
          force: true,
        },
        () => {
          const leftoverDeletedStatement = "Leftover trimmed_mix file deleted!";

          if (process.env.NODE_ENV === "production") {
            logger("server").info(leftoverDeletedStatement);
          } else {
            console.log(leftoverDeletedStatement);
          }
        }
      );
    }
  };

  if (accompaniment && vocals) {
    if (mixExists) {
      const songMode = accompaniment.mode;
      const accompanimentTitle = accompaniment.title;
      const accompanimentArtist = accompaniment.artist;
      const accompanimentID = accompaniment.id;
      const vocalsTitle = vocals.title;
      const vocalsArtist = vocals.artist;
      const vocalsID = vocals.id;

      const truncateString = (str: string) => {
        if (str.length > 50) {
          return str.slice(0, 51) + "...";
        } else {
          return str;
        }
      };

      const mashupTitle = `MASHUP - "${truncateString(
        accompanimentTitle
      )}" by ${truncateString(accompanimentArtist)} x "${truncateString(
        vocalsTitle
      )}" by ${truncateString(vocalsArtist)}`;

      const getErrorLogs = (err: any) => {
        if (process.env.NODE_ENV === "production") {
          logger("server").error(
            `Received error during entry creation: ${err}`
          );
        } else {
          console.error(`Received error during entry creation: ${err}`);
        }
      };

      client
        .getSpace(process.env.CONTENTFUL_SPACE_ID as string)
        .then((space) => {
          space
            .getEnvironment("master")
            .then((environment) => {
              // First add the accompaniment track as an asset in Contentful
              environment
                .createAssetFromFiles({
                  fields: {
                    title: {
                      "en-US": mashupTitle,
                    },
                    description: {
                      "en-US": `This is the mashup mix mp3 track of the accompaniment track "${accompanimentTitle}" by ${accompanimentArtist} with the vocals track "${vocalsTitle}" by ${vocalsArtist}.`,
                    },
                    file: {
                      "en-US": {
                        contentType: "audio/mp3",
                        fileName: `${truncateString(
                          accompanimentTitle
                        )} ${truncateString(
                          accompanimentArtist
                        )} x ${truncateString(vocalsTitle)} ${truncateString(
                          vocalsArtist
                        )} mashup.mp3`
                          .toLowerCase()
                          .replace(/ /g, "_"),
                        file: fs.readFileSync("trimmed_mix.mp3"),
                      },
                    },
                  },
                })
                .then((asset) => asset.processForAllLocales())
                .then((asset) => asset.publish())
                .then(async (mashupAsset) => {
                  return environment
                    .createEntry("mashup", {
                      fields: {
                        title: {
                          "en-US": mashupTitle,
                        },
                        blacklisted: {
                          "en-US": "pending",
                        },
                        duration: {
                          "en-US": mp3Duration,
                        },
                        mode: {
                          "en-US": songMode,
                        },
                        accompanimentTitle: {
                          "en-US": accompanimentTitle,
                        },
                        accompanimentArtist: {
                          "en-US": accompanimentArtist,
                        },
                        accompanimentSysId: {
                          "en-US": accompanimentID,
                        },
                        vocalsTitle: {
                          "en-US": vocalsTitle,
                        },
                        vocalsArtist: {
                          "en-US": vocalsArtist,
                        },
                        vocalsSysId: {
                          "en-US": vocalsID,
                        },
                        mixStart: {
                          "en-US": mixStart,
                        },
                        mixEnd: {
                          "en-US": mixEnd,
                        },
                        mix: {
                          "en-US": {
                            sys: {
                              id: mashupAsset.sys.id,
                              linkType: "Asset",
                              type: "Link",
                            },
                          },
                        },
                      },
                    })
                    .then((entry) => {
                      entry.publish();
                      deleteTrimmedMix();

                      const successStatement =
                        "Successfully created new mashup entry!";

                      if (process.env.NODE_ENV === "production") {
                        logger("server").info(successStatement);
                      } else {
                        console.log(successStatement);
                      }
                      callback(null, {
                        statusCode: 200,
                        body: JSON.stringify({
                          message: successStatement,
                        }),
                      });
                    })
                    .catch((err) => {
                      getErrorLogs(err);
                      deleteTrimmedMix();
                      callback(null, {
                        statusCode: 404,
                        body: JSON.stringify({
                          message: err,
                        }),
                      });
                    });
                })
                .catch((err) => {
                  getErrorLogs(err);
                  deleteTrimmedMix();
                  callback(null, {
                    statusCode: 404,
                    body: JSON.stringify({
                      message: err,
                    }),
                  });
                });
            })
            .catch((err) => {
              getErrorLogs(err);
              deleteTrimmedMix();
              callback(null, {
                statusCode: 404,
                body: JSON.stringify({
                  message: err,
                }),
              });
            });
        });
    } else {
      const doesntExistStatement =
        "Mashup mp3 audio does not exist! Moving on to next mashup.";

      if (process.env.NODE_ENV === "production") {
        logger("server").info(doesntExistStatement);
      } else {
        console.log(doesntExistStatement);
      }
      callback(null, {
        statusCode: 404,
        body: JSON.stringify({
          message: doesntExistStatement,
        }),
      });
    }
  } else {
    const doesntExistStatement =
      "Both accompaniment and vocals parameters are required in the addMixToContentful.js function! Aborting process and moving on to next mashup.";

    if (process.env.NODE_ENV === "production") {
      logger("server").info(doesntExistStatement);
    } else {
      console.log(doesntExistStatement);
    }
    callback(null, {
      statusCode: 404,
      body: JSON.stringify({
        message: doesntExistStatement,
      }),
    });
  }
};
