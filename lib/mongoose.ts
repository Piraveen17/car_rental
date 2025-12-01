import mongoose from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI!;
const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
};

export default connectToDatabase;
