
exports.publish_to_patient_information_channel = async (data, pub) => {
  return new Promise((resolve, reject) => {
    pub.publish("patient_information_channel", JSON.stringify(data), (err) => {
      if (err) {
        reject(false);
      } else {
        console.log(
          "**********data-published-to-(patient_information_channel)***********"
        );
        resolve(true);
      }
    });
  });
};
