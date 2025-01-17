const moment = require("moment");

exports.getNotificationService = (notificationdata) => {
  if (
    Array.isArray(notificationdata) &&
    notificationdata &&
    notificationdata.length > 0
  ) {
    let data = [];
    for (const notification of notificationdata) {
      const dateobj = new Date(notification.createdAt);
      const date = moment(dateobj).format("MM-DD-YYYY");
      const day = moment(dateobj).format("dddd");
      if (data.length === 0) {
        data.push({ message: notification.message, day: day, date: date });
      } else if (
        !data.some(
          (index) =>
            index.message === notification.message &&
            index.day === day &&
            index.date === date
        )
      ) {
        data.push({ message: notification.message, day: day, date: date });
      }
    }

    if (Array.isArray(data) && data && data.length > 0) {
      return data;
    }
  }
};
