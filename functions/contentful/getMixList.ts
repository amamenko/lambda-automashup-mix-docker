import axios from "axios";
import "dotenv/config";

export const getMixList = async () => {
  return await axios
    .get(
      `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/master/entries?access_token=${process.env.CONTENTFUL_ACCESS_TOKEN}&content_type=mixList&include=10`
    )
    .then((res) => res.data.items);
};
