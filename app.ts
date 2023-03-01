import { Context, APIGatewayEvent, APIGatewayProxyCallback } from "aws-lambda";
import { createMashup } from "./functions/mix/createMashup";
import warmer from "lambda-warmer";

export const lambdaHandler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback
) => {
  if (await warmer(event)) return "warmed";
  createMashup(callback);
};
