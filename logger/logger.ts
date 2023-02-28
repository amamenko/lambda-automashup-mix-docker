import winston from "winston";
import { PapertrailTransport } from "winston-papertrail-transport";
import "dotenv/config";

const hostname = "AutoMashupMix";
const container = new winston.Container();

const getConfig = (program: string) => {
  const transports = [];

  const papertrailTransport = new PapertrailTransport({
    host: process.env.PAPERTRAIL_HOST as string,
    port: process.env.PAPERTRAIL_PORT ? Number(process.env.PAPERTRAIL_PORT) : 0,
    hostname,
    program,
  });

  transports.push(papertrailTransport);

  return {
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(
        ({ level, message }: { level: string; message: string }) =>
          `${level} ${message}`
      )
    ),
    transports,
  };
};

export const logger = (program: string) => {
  return container.add(program, getConfig(program));
};
