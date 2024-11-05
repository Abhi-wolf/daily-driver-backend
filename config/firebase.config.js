// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBa6TrH__UZOeiudu-rIFygXN7q0QADiao",
  authDomain: "daily-driver-427ca.firebaseapp.com",
  projectId: "daily-driver-427ca",
  storageBucket: "daily-driver-427ca.appspot.com",
  messagingSenderId: "943322334444",
  appId: "1:943322334444:web:2a97176b7426c749c351c9",
  measurementId: "G-HS1Y0S028P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const STORAGE_FOLDER_PATH = "gs://daily-driver-427ca.appspot.com";

export const storage = getStorage(app, STORAGE_FOLDER_PATH);

export default app;

// import * as dotenv from "dotenv";
// dotenv.config();

// export default {
//   firebaseConfig: {
//     // apiKey: process.env.API_KEY,
//     // authDomain: process.env.AUTH_DOMAIN,
//     // projectId: process.env.PROJECT_ID,
//     // storageBucket: process.env.STORAGE_BUCKET,
//     // messagingSenderId: process.env.MESSAGING_SENDER_ID,
//     // appId: process.env.APP_ID,
//     // measurementId: process.env.MEASUREMENT_ID,
//     apiKey: "AIzaSyBa6TrH__UZOeiudu-rIFygXN7q0QADiao",
//     authDomain: "daily-driver-427ca.firebaseapp.com",
//     projectId: "daily-driver-427ca",
//     storageBucket: "daily-driver-427ca.appspot.com",
//     messagingSenderId: "943322334444",
//     appId: "1:943322334444:web:2a97176b7426c749c351c9",
//     measurementId: "G-HS1Y0S028P",
//   },
// };
