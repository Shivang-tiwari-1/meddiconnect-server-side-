const { client } = require("../../../Constants");

exports.fetch_data = async (role) => {
  if (role === "doctor") {
    const existing_data = await client.sMembers(`isActiveDoctors`);
    if (existing_data.length < 0) {
      return false;
    } else {
      return existing_data;
    }
  } else {
    const existing_data = await client.sMembers(`isActivePatients`);
    if (existing_data.length < 0) {
      return false;
    } else {
      return existing_data;
    }
  }
};
exports.push_data = async (data, role) => {
  console.log(data, role);
  if (role === "doctor") {
    const pushData = await client.sAdd(`isActiveDoctors`, data);
    if (pushData !== undefined || pushData !== null) {
      return true;
    } else {
      return false;
    }
  } else {
    const pushData = await client.sAdd(`isActivePatients`, data);
    if (pushData !== undefined || pushData !== null) {
      return true;
    } else {
      return false;
    }
  }
};
exports.remove_data = async (role, data) => {
  if (role === "doctor") {
    const remove_data = await client.sRem(
      `isActiveDoctors`,
      JSON.stringify(data)
    );
   
    if (remove_data > 0) {
      return true;
    } else {
      return false;
    }
  } else if (role === "patient") {
    const remove_data = await client.sRem(
      `isActivePatients`,
      JSON.stringify(data)
    );
    if (remove_data > 0) {
      return true;
    } else {
      return false;
    }
  }
};
exports.parse_data = (data) => {
  if (data) {
    const tobject = data.map((data) => JSON.parse(data));
    if (tobject) {
      return tobject;
    }
  } else {
    console.warn("please provide data that could be parsed");
    return false;
  }
};
exports.check_existing_doc = (data, id) => {
  if (data) {
    return data.some((existingid) => {
      return existingid.userId === id;
    });
  }
};
exports.fetchToDelete = (list, id) => {
  if (list) {
    return list.find((list) => {
      return (list.userId = id);
    });
  }
};
