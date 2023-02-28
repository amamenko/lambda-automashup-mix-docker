import { createMashup } from "./functions/mix/createMashup";

export const lambdaHandler = async (event, context) => {
  createMashup();
};
