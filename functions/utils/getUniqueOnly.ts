export const getUniqueOnly = (arr: any[]) => {
  const list = arr.map((item) => JSON.stringify(item));
  const uniqueList = new Set(list);
  const uniqueArr = Array.from(uniqueList).map((item) => JSON.parse(item));
  return uniqueArr;
};
