const crypto = require("crypto");

exports.encrypt = async (data, res) => {
  try {
    //1.create the initialization vector
    //2.create a cipheriv
    //3.set the encoding
    //4.finalize it
    //5.set iv and data in to an object

    const key = Buffer.from(
      process.env.ENCRYPTION_DECRYPTION_KEY,
      process.env.ENCRYPTION_DECRYPTION_TYPE
    );

    console.log("encryption started.......");
    const iv = crypto.randomBytes(16);
    if (!iv) {
      console.log("test1->failed");
      return false;
    } else {
      console.log("test1->passed");
    }

    const cipher = crypto.createCipheriv(
      process.env.ENCRYPTION_DECRYPTION_ALGORITHM,
      key,
      iv
    );
    if (!cipher) {
      return false;
    } else {
      console.log("test2->passed");
    }

    let encrypted = cipher.update(data, "utf-8", "hex");
    if (!encrypted) {
      return false;
    } else {
      console.log("test3->passed");
    }

    encrypted += cipher.final("hex");
    if (!encrypted) {
      return res.status(400).json({
        error: "could not process the finalization at :",
        details: { location: __filename },
      });
    } else {
      console.log("test4->passed");
    }

    const sensitiveData = { iv: iv.toString("hex"), encryptedData: encrypted };
    if (!sensitiveData) {
      return res
        .status(400)
        .json({ error: "could not create the sensitiveData" });
    } else {
      console.log("encryption ended.......");
      return sensitiveData;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.decrypt = (data, iv) => {
  try {
    //1.decipher the incoming data
    //2.set its encoding
    //3.finalize it
    const key = Buffer.from(
      process.env.ENCRYPTION_DECRYPTION_KEY,
      process.env.ENCRYPTION_DECRYPTION_TYPE
    );

    console.log("decryption started.......");
    const decipher = crypto.createDecipheriv(
      process.env.ENCRYPTION_DECRYPTION_ALGORITHM,
      key,
      Buffer.from(iv, "hex")
    );
    if (!decipher) {
      return false;
    } else {
      console.log("test1->passed");
    }

    let decrypted = decipher.update(data, "hex", "utf-8");
    if (!decrypted) {
      return false;
    } else {
      console.log("test2->passed");
    }

    decrypted += decipher.final("utf8");
    if (!decrypted) {
      return false;
    } else {
      console.log("decryption ended.......");
      return decrypted;
    }
  } catch (error) {
    return false;
  }
};
