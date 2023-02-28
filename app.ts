import { Context, APIGatewayEvent } from "aws-lambda";
import { createMashup } from "./functions/mix/createMashup";
import warmer from "lambda-warmer";

export const lambdaHandler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  if (await warmer(event)) return "warmed";
  createMashup();
};
