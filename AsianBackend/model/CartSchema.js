// model/CartSchema.js
import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        size: {
          type: String,
          default: null,
        },
        color: {
          type: String,
          default: null,
        },
        title: String,
        imgUrl: String,
        discountedprice: Number,
        ogprice: Number,
        discount: Number,
        category: String,
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Seller",
        },
      },
    ],
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
