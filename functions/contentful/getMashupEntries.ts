import axios from "axios";
import "dotenv/config";

interface CurrentSongs {
  vocalsTitle: string;
  vocalsArtist: string;
  accompanimentTitle: string;
  accompanimentArtist: string;
}

export const getMashupEntries = async (currentSongs: CurrentSongs) => {
  return await axios
    .get(
      `https://cdn.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/master/entries?access_token=${process.env.CONTENTFUL_ACCESS_TOKEN}&content_type=mashup&fields.vocalsTitle=${currentSongs.vocalsTitle}&fields.vocalsArtist=${currentSongs.vocalsArtist}&fields.accompanimentTitle=${currentSongs.accompanimentTitle}&fields.accompanimentArtist=${currentSongs.accompanimentArtist}&include=10`
    )
    .then((res) => res.data.items);
};
