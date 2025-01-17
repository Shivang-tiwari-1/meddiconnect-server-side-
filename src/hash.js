// // // const crypto = require("crypto");
// // const { ObjectId } = require("mongodb");
// const moment = require("moment");
// // const { serializeData } = require("./Repository/other.Repository");

// // // const encrypt = async (data) => {
// // //   try {
// // //     const key = Buffer.from("this_is_a_32_character_long_key_".trim(), "utf-8");
// // //     console.log("key-->", key);
// // //     const iv = crypto.randomBytes(16);
// // //     console.log("iv-->", iv);
// // //     const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
// // //     console.log("cipher-->", cipher);
// // //     let encrypted = cipher.update(data, "utf-8", "hex");
// // //     console.log("encrypted-->", encrypted);
// // //     encrypted += cipher.final("hex");
// // //     console.log("encrypted-final->", encrypted);
// // //     const sensitiveData = { iv: iv.toString("hex"), encryptedData: encrypted };
// // //     console.log("sensitiveData->", sensitiveData);
// // //   } catch (error) {
// // //     console.log(error);
// // //   }
// // // };

// // // async function decryptData(keyString, ivArray, encryptedBase64) {
// // //   const key = Buffer.from(keyString, "utf-8");
// // //   const iv = Buffer.from(ivArray);
// // //   const encryptedWithTag = Buffer.from(encryptedBase64, "base64");
// // //   const encrypted = encryptedWithTag.slice(0, -16);
// // //   const authTag = encryptedWithTag.slice(-16);

// // //   const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
// // //   decipher.setAuthTag(authTag);~

// // //   let decrypted = decipher.update(encrypted);
// // //   decrypted = Buffer.concat([decrypted, decipher.final()]);

// // //   return decrypted.toString("utf-8");
// // // }

// // // (async () => {
// // //   const key = "this_is_a_32_character_long_key_";
// // //   const iv = [237, 144, 165, 105, 51, 118, 234, 28, 162, 211, 169, 39];
// // //   const encrypted = "pSn5CQgizT0xXZnTsFcnNQZ2KlKxGW6/iw0BfaikVg==";

// // //   try {
// // //     const decrypted = await decryptData(key, iv, encrypted);
// // //     console.log("Decrypted:", decrypted);
// // //   } catch (err) {
// // //     console.error("Decryption Error:", err.message);
// // //   }
// // // })();
// // const data = [
// //   {
// //     charges: 0,
// //     _id: new ObjectId("672cd1ea90029833bf955c2d"),
// //     name: "Akash",
// //     email: "Akash@gmail.com",
// //     phone: 9326977987,
// //     gender: "Male",
// //     profileImage:
// //       "http://res.cloudinary.com/djfjghwdy/image/upload/v1730990570/Mediconnect/hvnxc904eeo8gbhirw3v.png",
// //     address: "twin tower",
// //     role: "doctor",
// //     history: [],
// //     qualification: [[Object]],
// //     specialization: [[Object], [Object], [Object], [Object]],
// //     patientStatus: [],
// //     Max: 47,
// //     availability: [],
// //     isActive: false,
// //   },
// //   {
// //     _id: new ObjectId("672ce58790029833bf955c33"),
// //     name: "Kaira",
// //     email: "Kaira@gmail.com",
// //     phone: 9326977987,
// //     gender: "Female",
// //     profileImage:
// //       "http://res.cloudinary.com/djfjghwdy/image/upload/v1730995591/Mediconnect/gxwsdyinksyw26ohlwcy.png",
// //     address: "twin tower",
// //     role: "doctor",
// //     history: [],
// //     qualification: [[Object]],
// //     specialization: [[Object], [Object], [Object], [Object]],
// //     Max: 9,
// //     availability: [
// //       [Object],
// //       [Object],
// //       [Object],
// //       [Object],
// //       [Object],
// //       [Object],
// //       [Object],
// //     ],
// //     patientStatus: [],
// //     isActive: false,
// //     charges: 0,
// //   },
// //   {
// //     charges: 0,
// //     _id: new ObjectId("672ce5a790029833bf955c36"),
// //     name: "Payal",
// //     email: "Payal@gmail.com",
// //     phone: 9326977987,
// //     gender: "Female",
// //     profileImage:
// //       "http://res.cloudinary.com/djfjghwdy/image/upload/v1730995623/Mediconnect/spnvtrwtlzzgbnwcrfsp.png",
// //     address: "twin tower",
// //     role: "doctor",
// //     history: [],
// //     qualification: [],
// //     specialization: [],
// //     patientStatus: [],
// //     availability: [],
// //     isActive: false,
// //   },
// //   {
// //     charges: 0,
// //     _id: new ObjectId("672ce5cb90029833bf955c39"),
// //     name: "Vaibhav",
// //     email: "Vaibhav@gmail.com",
// //     phone: 9326977987,
// //     gender: "Male",
// //     profileImage:
// //       "http://res.cloudinary.com/djfjghwdy/image/upload/v1730995659/Mediconnect/iegzt9gclarucdconldg.png",
// //     address: "twin tower",
// //     role: "doctor",
// //     history: [],
// //     qualification: [],
// //     specialization: [],
// //     patientStatus: [],
// //     availability: [],
// //     isActive: false,
// //   },
// // ];

// // console.log(JSON.stringify(data));
// const data = [
//   { id: 1, name: "Item 1", createdAt: "2024-11-07T16:07:03.599+00:00" },
//   { id: 2, name: "Item 2", createdAt: "2024-11-06T10:00:00.000+00:00" },
//   { id: 3, name: "Item 3", createdAt: "2024-11-08T08:30:00.000+00:00" },
//   { id: 4, name: "Item 4", createdAt: "2024-11-05T22:15:45.123+00:00" },
//   { id: 5, name: "Item 5", createdAt: "2024-11-07T18:45:00.000+00:00" },
// ];

// const day_matching_algo = async (data) => {
//   if (!Array.isArray(data) || data?.length === 0) {
//     throw ApiError(500, "array is empty");
//   } else {
//     for (let i = 0; i <= data.length - i; i++) {
//       for (let j = 0; j <= data.length - 1; j++) {
//         if (i !== j) {
//           if (moment(data[j].createdAt).diff(data[i].createdAt)) {
//             const temp = data[i];
//             data[i] = data[j];
//             data[j] = temp;
//           }
//         }
//       }
//     }
//     return data;
//   }
// };
// day_matching_algo(data).then(console.log);


// const sortedDescending = data.sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));
// console.log(sortedDescending);
// const sortedAscending = data.sort((a, b) => moment(a.createdAt).diff(moment(b.createdAt)));
// console.log(sortedAscending);
const sticky = require('sticky-session');
const http = require('http');

const requestHandler = (req, res) => {
  res.end(`Hello from sticky session worker ${process.pid}`);
};

const server = http.createServer(requestHandler);

if (sticky.listen(server, 8000)) {
  console.log('Sticky session started on http://localhost:8000');
} else {
  console.log('This is the master process');
}