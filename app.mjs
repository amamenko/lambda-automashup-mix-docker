const { createMashup } = require("./functions/mix/createMashup");
const warmer = require("lambda-warmer");

export const lambdaHandler = async (event, context) => {
  if (await warmer(event)) return "warmed";
  createMashup();
};
