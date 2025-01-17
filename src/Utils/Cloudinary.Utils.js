const cloudinary = require("cloudinary").v2;
const { CLOUDINARY_FOLDER } = require("../../Constants");
const ApiError = require("./Apierror.Utils");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.upload_Single_image = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: CLOUDINARY_FOLDER,
    });
    fs.unlinkSync(localFilePath);
    return response.url;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    throw new ApiError(
      500,
      error.message || "Something went wrong on cloudinary"
    );
  }
};

exports.delete_Old_Image_File_CLodinary = async (oldUri) => {
  try {
    let public_Id_To_Delete = oldUri.split("/Mediconnect").pop().split(".")[0];
    public_Id_To_Delete = "Mediconnect" + public_Id_To_Delete;
    await cloudinary.uploader.destroy(
      public_Id_To_Delete,
      {
        resource_type: "image",
      },
      (error) => {
        if (error) {
          throw new ApiError(401, "Error in Uploading to cloud");
        }
      }
    );
  } catch (error) {
    return null;
  }
};

exports.upload_multiple_file = async (localFilePaths) => {
  try {
    const uploadFiles = [];

    for (const fileArray of localFilePaths) {
      const filePath = fileArray[0].path;
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileStream = fs.createReadStream(filePath);

      const uploadResult = await new Promise((resolve, reject) => {
        const response = cloudinary.uploader.upload_stream(
          { folder: CLOUDINARY_FOLDER },
          (error, result) => {
            if (error) return reject(new Error(error.message));
            resolve(result.url);
          }
        );

        fileStream.pipe(response);
      });

      uploadFiles.push(uploadResult);

      fs.unlinkSync(filePath);
    }

    return uploadFiles;
  } catch (error) {
    // Clean up local files in case of error
    for (const fileArray of localFilePaths) {
      const filePath = fileArray[0].path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    throw new ApiError(
      500,
      error.message || "Something went wrong on Cloudinary"
    );
  }
};
