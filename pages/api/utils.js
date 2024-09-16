import { Timestamp } from 'firebase-admin/firestore';

export function isValidDateFormat(dateString) {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dateString)) {
    console.log('Date format validation failed');
    return false;
  }

  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);
  const isValid = date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
  console.log('Date validity:', isValid);
  return isValid;
}

export function convertToTimestamp(dateString, isStart) {
  if (!dateString) {
    throw new Error('Date string is invalid');
  }

  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);

  if (isNaN(date)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  // Set hours depending on whether it's the start or end of the day
  if (isStart) {
    date.setHours(0, 0, 0, 0);  // Beginning of the day
  } else {
    date.setHours(23, 59, 59, 999);  // End of the day
  }

  return Timestamp.fromDate(date);
}
