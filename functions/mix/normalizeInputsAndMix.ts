import fs from "fs";
import axios from "axios";
import { mixTracks } from "./mixTracks";
import { delayExecution } from "../utils/delayExecution";
import { logger } from "../../logger/logger";
import { getAssetUrl } from "../contentful/getAsset";
import "dotenv/config";

export interface SongObj {
  id: string;
  mode: string;
  sections: any[];
  title: string;
  artist: string;
  duration: number;
  currentSection: string;
  beats: string | number[];
  keyScaleFactor: number;
  tempoScaleFactor: number;
  fields: {
    beats: number[];
    duration: number;
    sections: any[];
  };
  accompaniment?: {
    sys: any;
    fields: {
      file: {
        url: string;
      };
    };
  };
  vocals?: {
    sys: any;
    fields: {
      file: {
        url: string;
      };
    };
  };
}

export const normalizeInputsAndMix = async (
  instrumentals: SongObj,
  vocals: SongObj
) => {
  if (instrumentals && vocals) {
    const accompanimentLink = await getAssetUrl(
      instrumentals.accompaniment.sys.id
    );
    const voxLink = await getAssetUrl(vocals.vocals.sys.id);

    if (accompanimentLink && voxLink) {
      const accompanimentURL = "https:" + accompanimentLink;
      const voxURL = "https:" + voxLink;

      if (!fs.existsSync("./functions/mix/inputs")) {
        fs.mkdirSync("./functions/mix/inputs");
      }

      const accompanimentPath = "./functions/mix/inputs/accompaniment.mp3";
      const voxPath = "./functions/mix/inputs/vox.mp3";

      const streamArr = [
        {
          name: "accompaniment",
          url: accompanimentURL,
          path: accompanimentPath,
        },
        {
          name: "vox",
          url: voxURL,
          path: voxPath,
        },
      ];

      for (const file of streamArr) {
        const writer = fs.createWriteStream(file.path);

        const response = await axios({
          url: file.url,
          method: "GET",
          responseType: "stream",
        });

        response.data.pipe(writer);

        response.data.on("error", (err: any) => {
          const errorStatement =
            "Received an error when attempting to download song entry audio. Terminating process. Output: ";
          if (process.env.NODE_ENV === "production") {
            logger("server").error(`${errorStatement}: ${err}`);
          } else {
            console.error(errorStatement + err);
          }
          return `${errorStatement}${err}`;
        });

        response.data.on("end", () => {
          const finishStatement = `Successfully downloaded song entry ${file.name} audio from ${file.url} to ${file.path}.`;
          if (process.env.NODE_ENV === "production") {
            logger("server").info(finishStatement);
          } else {
            console.log(finishStatement);
          }
        });
      }

      await delayExecution(10000);

      return await mixTracks(instrumentals, vocals, accompanimentPath, voxPath);
    }
  } else {
    return "Missing either instrumentals or vocals data!";
  }
};
