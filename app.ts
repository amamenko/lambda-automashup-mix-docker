import { Context, APIGatewayProxyCallback } from "aws-lambda";
import { createMashup } from "./functions/mix/createMashup";

export const lambdaHandler = async (
  event: any,
  context: Context,
  callback: APIGatewayProxyCallback
) => {
  if (event && event.warmer) {
    return "warmed";
  } else {
    const resolvedMashup = await createMashup();
    return resolvedMashup;
  }
};
