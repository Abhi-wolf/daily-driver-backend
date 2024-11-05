import {
  ref,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { storage } from "../config/firebase.config.js";
import fs from "fs";
import mime from "mime-types";

export async function uploadFile(localFilePath) {
  try {
    if (!localFilePath) return null;

    const storageRef = ref(storage, `${localFilePath}`);

    const fileBuffer = fs.readFileSync(localFilePath);
    const fileSize = fs.statSync(localFilePath).size;

    const contentType = mime.lookup(localFilePath);
    const metadata = {
      contentType,
      customMetadata: {
        originalName: localFilePath.split("-").pop(),
        uploadTime: new Date().toISOString(),
        fileSize: `${fileSize} bytes`,
      },
    };

    const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Optionally, delete the local file after upload
    fs.unlinkSync(localFilePath);

    return { url: downloadURL, metadata };
  } catch (error) {
    console.error("Error uploading file to Firebase:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Remove local file in case of error
    }
    return null;
  }
}

export async function deleteFile(fileUrl) {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Error uploading file to Firebase:", error);
    return null;
  }
}
