// model/Banner.schema.js
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const BannerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Subtitle cannot exceed 200 characters"],
    },
    image: {
      type: String,
      required: [true, "Image is required"],
    },
    link: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      enum: ["home-top", "home-middle", "category-top", "sidebar"],
      default: "home-top",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    order: {
      // Changed from sortOrder to match frontend
      type: Number,
      default: 0,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: false,
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", BannerSchema);
export default Banner;
