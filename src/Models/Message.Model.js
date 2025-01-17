const { default: mongoose } = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    receiver: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    role: {
      type: String,
      enum: ["sender", "receiver"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
// MessageSchema.pre("save", function (next) {
//   if (!this.sender || !this.receiver) {
//   }
// });

const Messages = mongoose.model("Messages", MessageSchema);
module.exports = Messages;
