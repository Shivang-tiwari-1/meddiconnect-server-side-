const { client } = require("../../Constants");
const { asyncHandler } = require("../Utils/AsyncHandler.Utiles");
const { decrypt } = require("../Utils/encryptioDecription.Utils");
const { encrypt } = require("../Utils/encryptioDecription.Utils");
const ApiResponse = require("../Utils/Apiresponse.utils");
const ApiError = require("../Utils/Apierror.Utils");
const {
  parse_data,
  check_existing_doc,
  fetch_data,
  remove_data,
  fetchToDelete,
} = require("../Redis/RedisListOperation/RedisList");

exports.cacheMiddlWare = asyncHandler(async (req, res, next) => {
  console.log("|||");
  console.log("getting the data from redis........");
  const { redisKey } = req.query;
  let data;
  if (redisKey) {
    if (req.user) {
      data = await client.hGet(`user:${req.user.id}`, `${redisKey}`);
    } else {
      data = await client.hGet(`user:${req.doctor.id}`, `${redisKey}`);
    }
  } else {
    data = await client.hGet(`user:${req.user.id}`);
  }

  if (data !== null) {
    if (Object.keys(data)?.length !== 0) {
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
            console.error("could not decrypt-(should look in to it)");
          } else {
            console.log("delivering from redis");
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
      console.log("empty data fetched ");
      console.log("|||");
      next();
    }
  } else {
    console.log("Cache miss ");
    console.log("|||");
    next();
  }
  console.log("data fetched form the redis........");
  console.log("|||");
});
exports.setCahe = asyncHandler(async (redisKey, data, id) => {
  console.log("|||");
  console.log("setting cache.....");
  if (data?.length !== 0 || Object.keys(data)?.length !== 0) {
    const { iv, encryptedData } = await encrypt(JSON.stringify(data));
    if (!iv && encryptedData) {
      console.log("Encryption failed");
      throw new ApiError(500, "Could not encrypt the data ");
    } else {
      console.log("test1->passed");

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
        console.error("could not cache-(look in to it)");
      } else {
        console.log("test2->passed");
      }
    }
  } else {
    console.log("data you are trying to cache is empty");
    console.log("|||");
  }
  console.log("caching done.....");
  console.log("|||");
});
exports.setuser_is_active_data = asyncHandler(async (userid, role) => {
  console.log("|||");
  console.log("setting doctor data in redis.....");
  const status = {
    online: true,
    userId: userid,
    lastActive: new Date().toISOString(),
    role: role,
  };

  const existingData = await fetch_data("doctor");
  if (existingData.length > 0) {
    const toObject = parse_data(existingData);
    if (!toObject) {
      throw new ApiError(500, "function failed to parse the data");
    }
    console.log(toObject);
    const existing_user = check_existing_doc(toObject, status.userId);
    if (existing_user) {
      const filterdata = fetchToDelete(toObject, userid);
      if (filterdata === undefined) {
        throw new ApiError("could not find  the document");
      }
      console.log(filterdata);
      const remove_prev_data = await remove_data(filterdata?.role, filterdata);
      if (!remove_prev_data) {
        throw new ApiError(500, "could not remove the prev data ");
      }

      const cacheData = await client.sAdd(
        `isActiveDoctors`,
        JSON.stringify(status)
      );
      if (cacheData === null || cacheData === undefined) {
        throw new ApiError(500, "Data could not be cached");
      } else {
        console.log("test2->passed");
        return true;
      }
    } else {
      console.warn("new data");
      const cacheData = await client.sAdd(
        `isActiveDoctors`,
        JSON.stringify(status)
      );
      if (cacheData === null || cacheData === undefined) {
        throw new ApiError(500, "Data could not be cached");
      } else {
        console.log("test2->passed");
        return true;
      }
    }
  } else {
    console.log("redis-set is empty- adding its first data ");
    const cacheData = await client.sAdd(
      `isActiveDoctors`,
      JSON.stringify(status)
    );
    if (cacheData === null || cacheData === undefined) {
      throw new ApiError(500, "Data could not be cached");
    } else {
      console.log("test2->passed");
      console.log("userid with status is cached done.....");
      console.log("|||");
      return true;
    }
  }
});
exports.set_patient_active = asyncHandler(async (userid, role) => {
  console.log("|||");
  console.log("setting doctor data in redis.....");
  const status = {
    online: true,
    userId: userid,
    lastActive: new Date().toISOString(),
    role: role,
  };

  const existingData = await fetch_data("patient");
  if (existingData.length > 0) {
    const toObject = parse_data(existingData);
    if (!toObject) {
      throw new ApiError(500, "function failed to parse the data");
    }

    const existing_user = check_existing_doc(toObject, status.userId);
    if (existing_user) {
      const filterdata = fetchToDelete(toObject, userid);
      if (filterdata === undefined) {
        throw new ApiError("could not find  the document");
      }

      const remove_prev_data = await remove_data(filterdata?.role, filterdata);
      if (!remove_prev_data) {
        throw new ApiError(500, "could not remove the prev data ");
      }

      const cacheData = await client.sAdd(
        `isActivePatients`,
        JSON.stringify(status)
      );
      if (cacheData === null || cacheData === undefined) {
        throw new ApiError(500, "Data could not be cached");
      } else {
        console.log("test2->passed");
        return true;
      }
    } else {
      console.warn("adding a new data");
      const cacheData = await client.sAdd(
        `isActivePatients`,
        JSON.stringify(status)
      );
      if (cacheData === null || cacheData === undefined) {
        throw new ApiError(500, "Data could not be cached");
      } else {
        console.log("test2->passed");
        return true;
      }
    }
  } else {
    console.log("redis-set is empty adding a completely new data");
    const cacheData = await client.sAdd(
      `isActivePatients`,
      JSON.stringify(status)
    );
    if (cacheData === null || cacheData === undefined) {
      throw new ApiError(500, "Data could not be cached");
    } else {
      console.log("test2->passed");
      console.log("userid with status is cached done.....");
      console.log("|||");
      return true;
    }
  }
});
