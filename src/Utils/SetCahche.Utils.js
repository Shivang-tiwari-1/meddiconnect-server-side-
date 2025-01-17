const { client } = require("../../Constants");
const { encrypt, decrypt } = require("./encryptioDecription.Utils");
const { message } = require("./VerfiyAuthority");
const ApiResponse = require("./Apiresponse.utils");

let result;

exports.SetCahche = async (req, res, data) => {
  console.log("Caching function initiated...");
  console.log("Data to cache:", data);

  try {
    // Encrypt the data
    // Set the encrypted data in Redis with expiry
    // Indicate success
    const { iv, encryptedData } = await encrypt(JSON.stringify(data), res);
    console.log("setting cache.......");
    if (!iv || !encryptedData) {
      console.log("Encryption failed");
      return false;
    } else {
      console.log("test1 -> passed");
    }

    const cacheData = await client.set(
      "data",
      JSON.stringify({ iv, encryptedData }),
      {
        EX: 60 * 60 * 24,
      }
    );
    if (!cacheData) {
      console.log("Data could not be cached");
      return false;
    } else {
      console.log("test2 -> passed");
    }
    console.log("setting cache ended.......");

    return true;
  } catch (error) {
    console.error("An error occurred in SetCache:", error);
    return false;
  }
};

exports.getCache = async (req, res) => {
  console.log("retriving cache data..");

  const redis_data = await client.get("data");
  if (redis_data !== null) {
    const parseData = JSON.parse(redis_data);
    if (parseData) {
      console.log("test1->passed");
    } else {
      console.log("test1->failed");
      return (result = false);
    }

    const decryptedDate = decrypt(parseData?.encryptedData, parseData?.iv, res);
    if (decryptedDate) {
      console.log("test2->passed");
      return JSON.parse(decryptedDate);
    } else {
      console.log("test2->failed");
      return (result = failed);
    }
  } else {
    console.log("cache miss");
  }
};
