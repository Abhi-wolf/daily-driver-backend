import dotenv from "dotenv";
import connectDB from "./db/mongodb.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is listening at port : ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connection error : ", error);
  });
