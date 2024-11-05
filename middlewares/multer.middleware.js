import multer from "multer";
import fs from "fs";

const multerUpload = (destination) => {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destination); // Use the destination from the route
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now();
      cb(null, uniqueSuffix + "-" + file.originalname); // Create a unique filename
    },
  });

  // Return the multer instance
  return multer({ storage });
};

export { multerUpload };
