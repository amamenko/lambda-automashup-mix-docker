import contentfulManagement from "contentful-management";
import "dotenv/config";

export const addMashupPositionValue = async (
  mixChartID: string,
  currentIndex: number
) => {
  // Access to Contentful Management API
  const managementClient = contentfulManagement.createClient({
    accessToken: process.env.CONTENT_MANAGEMENT_TOKEN as string,
  });

  return await managementClient
    .getSpace(process.env.CONTENTFUL_SPACE_ID as string)
    .then((space) => {
      space.getEnvironment("master").then((environment) => {
        environment.getEntry(mixChartID).then((entry) => {
          entry.fields.currentLoopPosition = {
            "en-US": currentIndex + 1,
          };

          entry.update().then(() => {
            environment.getEntry(mixChartID).then((updatedEntry) => {
              updatedEntry.publish();
            });
          });
        });
      });
    });
};
