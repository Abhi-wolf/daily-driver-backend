import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      process.env.CONNECTION_STRING
    );
    console.log("MongoDB connected");
  } catch (error) {
    console.log("Database connection error : ", error);
  }
};

export default connectDB;
