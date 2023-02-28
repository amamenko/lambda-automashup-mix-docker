export const timeStampToSeconds = (timestamp: string) => {
  if (timestamp) {
    const timeArr = timestamp.split(":").map((item) => Number(item));

    let totalSeconds = 0;

    totalSeconds += timeArr[0] * 3600;
    totalSeconds += timeArr[1] * 60;
    totalSeconds += timeArr[2];

    return totalSeconds;
  } else {
    return 0;
  }
};
