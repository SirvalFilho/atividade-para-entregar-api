import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  firstName: String,
  lastName: String,
  gender: String,
  dateOfBirth: Date,
  preference: String,
  interests: [String],
});

const User = mongoose.model("Users", userSchema);

export default User;
