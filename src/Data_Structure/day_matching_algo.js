const ApiError = require("../Utils/Apierror.Utils");
const moment = require("moment");

exports.day_matching_algo = async (data) => {
  if (!Array.isArray(data) || data?.length === 0) {
    throw ApiError(500, "array is empty");
  } else {
    for (let i = 0; i <= data.length - i; i++) {
      for (let j = 0; j <= data.length - 1; j++) {
        if (i !== j) {
          if (moment(data[j].createdAt).isBefore(data[i].createdAt)) {
            const temp = date[i];
            data[i] = data[j];
            data[j] = temp;
          }
        }
      }
    }
  }
};
