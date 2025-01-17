const { client } = require("../../Constants");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { decrypt } = require("../Utils/encryptioDecription.Utils");
const { getLineNumber } = require("../Utils/ErrorAtLine");
const { encrypt } = require("../Utils/encryptioDecription.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");
const ApiError = require("../Utils/Apierror.Utils");

exports.cacheMiddlWare = asyncHandler(async (req, res, next) => {
  console.log("|||");
  console.log("caching Middleware started........");
  const { redisKey } = req.query;
  let data;
  if (req.user) {
    data = await client.hGet(`user:${req.user.id}`, redisKey);
  } else {
    data = await client.hGet(`user:${req.doctor.id}`, `${redisKey}`);
  }
  if (data !== null) {
    console.log("test1->passed");
    if (redisKey) {
      const parseDate = JSON.parse(data);
      if (!parseDate) {
        console.log("test2->failed");
        throw new ApiError(500, "could not parse the data");
      } else {
        console.log("test2->passed");

        const decryptedDate = decrypt(
          parseDate?.encryptedData,
          parseDate?.iv,
          res
        );
        if (!decryptedDate) {
          return message(req, res, 500, "could not decrypt");
        } else {
          console.log("deleviring from redis");
          return res
            .status(200)
            .json(
              new ApiResponse(200, JSON.parse(decryptedDate), "cached data")
            );
        }
      }
    } else {
      console.log("test2->failed");
    }
  } else {
    console.log("Cache miss");
    console.log("|||");
    next();
  }
  console.log("caching Middleware ended........");
  console.log("|||");
});

exports.setCahe = asyncHandler(async (redisKey, data, id) => {
  console.log("|||");
  console.log("setting cache.....");
  const { iv, encryptedData } = await encrypt(JSON.stringify(data));
  console.log("encryptedData,iv->", encryptedData, iv);
  if (!iv && encryptedData) {
    console.log("Encryption failed");
    throw new ApiError(500, "Could not encrypt the data ");
  } else {
    console.log("test1->passed");

    console.log(redisKey, encryptedData, id);
    const cacheData = await client.hSet(
      `user:${id}`,
      `${redisKey}`,
      JSON.stringify({
        iv,
        encryptedData,
      })
    );
    await client.expire(
      `user:${id}`,
      parseInt(process.env.REDIS_CACHE_EXPIRY, 10)
    );
    if (!cacheData) {
      throw new ApiError(500, "Data could not be cached");
    } else {
      console.log("test2->passed");
    }
  }
  console.log("caching done.....");
  console.log("|||");
});
