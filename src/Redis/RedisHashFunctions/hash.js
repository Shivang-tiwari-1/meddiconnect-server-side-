const { client } = require("../../../Constants");

exports.check_if_exits = async (data) => {
  if (data.role === "patient") {
    const eistingdata = await client.hExists(
      `patientActiveStatus`,
      `${data.id}`
    );
    return eistingdata;
  } else if (data.role === "doctor") {
    const eistingdata = await client.hExists(
      `doctorActiveStatus`,
      `${data.id}`
    );
    return eistingdata;
  }
};

exports.push_hash_data = async (data) => {
  if (data.role === "doctor") {
    const fetchData = await client.hSet(
      "doctorActiveStatus",
      `${data.id}`,
      JSON.stringify(data.data)
    );
    if (fetchData === 1) {
      console.log("✅ New entry added.");
      return true;
    } else if (fetchData === 0) {
      console.log("🔁 Entry updated.");
      return true;
    } else {
      return false;
    }
  } else if (data.role === "patient") {
    const fetchData = await client.hSet(
      "patientActiveStatus",
      `${data.id}`,
      JSON.stringify(data.data)
    );
    console.log(fetchData);
    if (fetchData === 1) {
      console.log("✅ New entry added.");
      return true;
    } else if (fetchData === 0) {
      console.log("🔁 Entry updated.");
      return true;
    } else {
      return false;
    }
  }
};

exports.toArray = async (data) => {
  const Data = Object.entries(data).map(([key, value]) => {
    return {
      key,
      ...JSON.parse(value),
    };
  });

  return Data;
};

exports.fetch_all_data = async (data) => {
  let cursor = 0;
  let Data;
  if (data.role === "patient") {
    do {
      const { cursor: nextCursor, tuples: data } = await client.hScan(
        "patientActiveStatus",
        cursor,
        {
          COUNT: 100,
        }
      );
      Data = data.map(({ field, value }) => ({
        key: field,
        ...JSON.parse(value),
      }));

      cursor = Number(nextCursor);
    } while (cursor !== 0);
    console.log(Data);
    if (Data.length !== 0) {
      return Data;
    } else {
      1;
      return false;
    }
  } else if (data.role === "doctor") {
    do {
      const { cursor: nextCursor, tuples: data } = await client.hScan(
        "doctorActiveStatus",
        cursor,
        {
          COUNT: 100,
        }
      );
      Data = data.map(({ field, value }) => ({
        key: field,
        ...JSON.parse(value),
      }));

      cursor = Number(nextCursor);
    } while (cursor !== 0);

    if (Data.length !== 0) {
      return Data;
    } else {
      return false;
    }
  }
};

exports.get_hash_online_data = async (data) => {
  console.log(typeof data?.id);
  if (data.role === "patient") {
    const get_data = await client.hGet(`patientActiveStatus`, `${data.id}`);
    if (get_data) {
      return get_data;
    } else {
      return false;
    }
  } else if (data.role === "doctor") {
    const get_data = await client.hGet(`doctorActiveStatus`, `${data.id}`);
    if (get_data) {
      return get_data;
    } else {
      return false;
    }
  }
};

exports.parse_hash = async (data) => {
  if (typeof data === "string") {
    const parsed = JSON.parse(data);
    return parsed;
  } else {
    return false;
  }
};
