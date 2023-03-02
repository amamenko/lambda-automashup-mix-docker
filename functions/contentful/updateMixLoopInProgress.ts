import { createClient } from "contentful-management";
import { logger } from "../../logger/logger";
import { getMostRecentSaturday } from "../utils/getMostRecentSaturday";
import { APIGatewayProxyCallback } from "aws-lambda";
import "dotenv/config";

export const updateMixLoopInProgress = async (
  callback: APIGatewayProxyCallback,
  mixChartID: string,
  state: string
) => {
  // Access to Contentful Management API
  const managementClient = createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN as string,
  });

  const mostRecentSaturday = getMostRecentSaturday();

  const errorLog = (err: any) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(
        `Received error when attempting to update mix loop in progress: ${err}`
      );
    } else {
      console.error(err);
    }
    return callback(null, {
      statusCode: 404,
      body: JSON.stringify({
        message: err,
      }),
    });
  };

  return await managementClient
    .getSpace(process.env.CONTENTFUL_SPACE_ID as string)
    .then(async (space) => {
      return await space
        .getEnvironment("master")
        .then(async (environment) => {
          return await environment
            .getEntry(mixChartID)
            .then(async (entry) => {
              entry.fields.loopInProgress = {
                "en-US": state === "in progress" ? true : false,
              };

              if (state === "done") {
                entry.fields.currentLoopPosition = {
                  "en-US": 0,
                };
              } else {
                entry.fields.mostRecentLoopWeek = {
                  "en-US": mostRecentSaturday,
                };
              }

              return await entry
                .update()
                .then(() => {
                  environment.getEntry(mixChartID).then((updatedEntry) => {
                    updatedEntry.publish();

                    const successStatement = `Entry update was successful! ${
                      updatedEntry.fields.title["en-US"]
                    } loop marked as ${
                      state === "in progress" ? "in progress." : "done."
                    }`;

                    if (process.env.NODE_ENV === "production") {
                      logger("server").info(successStatement);
                    } else {
                      console.log(successStatement);
                    }

                    return;
                  });
                })
                .catch((e) => errorLog(e));
            })
            .catch((e) => errorLog(e));
        })
        .catch((e) => errorLog(e));
    })
    .catch((e) => errorLog(e));
};
