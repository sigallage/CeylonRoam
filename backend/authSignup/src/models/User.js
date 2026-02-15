const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },

    // NOTE: You asked for "without the security part".
    // This stores passwords as plain text, which is unsafe.
    password: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model('User', UserSchema);
