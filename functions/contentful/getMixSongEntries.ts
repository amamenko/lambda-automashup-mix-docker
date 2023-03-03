import axios from "axios";
import "dotenv/config";

export const getMixSongEntries = async (currentIds: string) => {
  return await axios
    .get(
      `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/master/entries?access_token=${process.env.CONTENTFUL_ACCESS_TOKEN}&content_type=song&sys.id[in]=${currentIds}`
    )
    .then((res) => res.data.items);
};
