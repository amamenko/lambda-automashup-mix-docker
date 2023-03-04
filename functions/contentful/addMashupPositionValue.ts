import { createClient } from "contentful-management";
import "dotenv/config";

export const addMashupPositionValue = async (
  mixChartID: string,
  currentIndex: number
) => {
  // Access to Contentful Management API
  const managementClient = createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN as string,
  });

  return await managementClient
    .getSpace(process.env.CONTENTFUL_SPACE_ID as string)
    .then(async (space) => {
      return await space.getEnvironment("master").then(async (environment) => {
        return await environment.getEntry(mixChartID).then(async (entry) => {
          entry.fields.currentLoopPosition = {
            "en-US": currentIndex + 1,
          };

          return await entry.update().then(async () => {
            return await environment
              .getEntry(mixChartID)
              .then(async (updatedEntry) => {
                await updatedEntry.publish();
                return true;
              });
          });
        });
      });
    });
};
