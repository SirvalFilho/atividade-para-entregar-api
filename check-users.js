import mongoose from "mongoose";
import mongod from "./db.js";
import User from "./models/User.js";

async function checkUsers() {
  try {
    await mongoose.connect(mongod.getUri());
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUsers();
