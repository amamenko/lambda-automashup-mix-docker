import { timeStampToSeconds } from "../utils/timeStampToSeconds";

export const findClosestBeat = (
  seconds: number,
  song: { [key: string]: any }
) => {
  let beats = song.beats ? song.beats : song.fields.beats;

  if (typeof beats === "string") {
    beats = beats.split(", ");
  }

  const closest = beats.reduce((a: number, b: number) => {
    return Math.abs(b - seconds) < Math.abs(a - seconds) ? b : a;
  });
  const indexClosest = beats.findIndex((item: number) => item === closest);

  if (song.currentSection === "vocals") {
    return beats[indexClosest + 5];
  } else {
    return beats[indexClosest + 1];
  }
};

export function getClosestBeatArr(
  section: { [key: string]: any },
  index: number,
  arr: any[]
) {
  const song = this as unknown as any;
  const nextSection = arr[index + 1];
  const startTime = findClosestBeat(timeStampToSeconds(section.start), song);
  const nextSectionStartTime = nextSection
    ? findClosestBeat(timeStampToSeconds(nextSection.start), song)
    : song.duration
    ? song.duration
    : song.fields.duration;

  return {
    start: startTime,
    duration: nextSectionStartTime - startTime,
    sectionName: section.sectionName,
  };
}
