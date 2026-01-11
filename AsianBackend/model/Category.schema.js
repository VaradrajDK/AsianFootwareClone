// model/Category.schema.js
import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    subCategories: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: "",
        },
      },
    ],
    // Make seller optional for admin-created categories
    seller: {
      type: Schema.Types.ObjectId,
      ref: "Seller",
      required: false, // ✅ Changed from required: true
    },
    // Optional: Track who created the category
    createdBy: {
      type: Schema.Types.ObjectId,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      enum: ["Admin", "Seller"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);
export default Category;
