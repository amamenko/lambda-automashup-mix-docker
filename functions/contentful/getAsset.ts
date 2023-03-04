import axios from "axios";
import "dotenv/config";

export const getAssetUrl = async (assetId: string) => {
  return await axios
    .get(
      `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/master/assets/${assetId}?access_token=${process.env.CONTENTFUL_ACCESS_TOKEN}`
    )
    .then((res) => res.data.fields.file.url);
};
