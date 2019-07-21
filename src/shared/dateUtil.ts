// TODO: I bet there's a better way to do this, but it'll do for now
const yyyyMMdd = (date: Date, seperator = ''): string => {
  let month: any = date.getMonth() + 1;
  let day: any = date.getDate();
  const year: any = date.getFullYear();

  if (month.toString().length < 2) {
    month = '0' + month;
  }
  if (day.toString().length < 2) {
    day = '0' + day;
  }

  return `${year}${seperator}${month}${seperator}${day}`;
};

export { yyyyMMdd }
