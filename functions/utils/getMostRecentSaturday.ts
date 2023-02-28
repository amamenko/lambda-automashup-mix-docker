import { format, startOfWeek } from "date-fns";

export const getMostRecentSaturday = () => {
  const upcomingSaturday = format(
    startOfWeek(new Date(), {
      weekStartsOn: 6,
    }),
    "yyyy-MM-dd"
  );

  return upcomingSaturday;
};
