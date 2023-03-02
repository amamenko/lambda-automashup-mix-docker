import { Context, APIGatewayEvent, APIGatewayProxyCallback } from "aws-lambda";
import { createMashup } from "./functions/mix/createMashup";
import warmer from "lambda-warmer";

export const lambdaHandler = async (
  event: APIGatewayEvent,
  context: Context,
  callback: APIGatewayProxyCallback
) => {
  if (event.body) {
    const body = JSON.parse(event.body);
    if (body.warmer && (await warmer(event))) {
      return "warmed";
    } else {
      return "no warmer on body";
    }
  } else {
    createMashup(callback);
  }
};
