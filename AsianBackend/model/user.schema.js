// model/user.schema.js
import mongoose, { Schema } from "mongoose";

const AddressSchema = new Schema({
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  mobile: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  label: { type: String, enum: ["home", "work", "other"], default: "home" },
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new Schema({
  name: { type: String, required: false },
  mobile: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  dob: { type: String, required: false },
  gender: { type: String, enum: ["male", "female", "other"], required: false },
  alternateMobile: { type: String, required: false },
  addresses: [AddressSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);

export default User;
