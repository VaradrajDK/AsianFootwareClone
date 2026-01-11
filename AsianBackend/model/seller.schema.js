// model/seller.schema.js
import mongoose, { Schema } from "mongoose";

const SellerSchema = new Schema({
  name: { type: String, required: false },
  mobile: { type: String, required: true }, // Changed to String for consistency
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: "seller" },
  brandName: { type: String, required: false },
  isActive: { type: Boolean, default: true }, // Added
  isVerified: { type: Boolean, default: false }, // Added
  verifiedAt: { type: Date }, // Added
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // Added
});

const Seller = mongoose.model("Seller", SellerSchema);

export default Seller;
