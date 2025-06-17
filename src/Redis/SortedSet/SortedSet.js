const { redis } = require("../../../Constants");

exports.fetch_mess_sorted_set = async (data) => {
  console.log(data);

  const skip = parseInt(data?.skip ?? 0);
  const limit = parseInt(data?.Limit ?? 10);
  const redis_messages = await redis.zrange(
    `from:${data?.senderid}:to${data?.recipent}`,
    skip,
    skip + limit - 1,
    "WITHSCORES"
  );
  if (redis_messages?.length > 0) {
    return redis_messages;
  } else {
    return false;
  }
};
