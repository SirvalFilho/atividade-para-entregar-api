import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: "ObjectId",
    ref: "Users",
    required: true,
  },
  receiver: {
    type: "ObjectId",
    ref: "Users",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Messages", messageSchema);

export default Message;
