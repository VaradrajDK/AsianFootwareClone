// models/Wishlist.model.js
import mongoose, { Schema } from "mongoose";

const WishlistItemSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Snapshot of product data at the time of adding
    title: { type: String, required: true },
    image: { type: String }, // ADD THIS LINE
    color: { type: String }, // e.g. "Slate Grey" or variant color
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    offer: { type: Number, default: 0 }, // % discount
  },
  { timestamps: true }
);

// Prevent duplicates per user-product-color
WishlistItemSchema.index(
  { userId: 1, productId: 1, color: 1 },
  { unique: true }
);

const Wishlist = mongoose.model("Wishlist", WishlistItemSchema);
export default Wishlist;
