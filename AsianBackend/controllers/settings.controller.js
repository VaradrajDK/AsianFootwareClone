import Category from "../model/Category.schema.js";
import Banner from "../model/Banner.schema.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// ============================================
// CATEGORY FUNCTIONS (No changes needed)
// ============================================

// Add new category
const AddCategories = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
        success: false,
      });
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
      seller: userId,
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Category with this name already exists",
        success: false,
      });
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description || "",
      subCategories: [],
      seller: userId,
    });

    await newCategory.save();

    return res.status(201).json({
      message: "Category added successfully",
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category with this name already exists",
        success: false,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation Error",
        errors: messages,
        success: false,
      });
    }

    return res.status(500).json({
      message: "Server error while adding category",
      success: false,
      error: error.message,
    });
  }
};

const GetCategories = async (req, res) => {
  try {
    const userId = req.userId;

    const categories = await Category.find({ seller: userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      message: "Categories fetched successfully",
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: "Server error while fetching categories",
      success: false,
      error: error.message,
    });
  }
};

const GetCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }

    const category = await Category.findOne({
      _id: id,
      seller: userId,
    }).select("-__v");

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Category fetched successfully",
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({
      message: "Server error while fetching category",
      success: false,
      error: error.message,
    });
  }
};

const UpdateCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
        success: false,
      });
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
      seller: userId,
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Another category with this name already exists",
        success: false,
      });
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { _id: id, seller: userId },
      {
        name: name.trim(),
        description: description || "",
      },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!updatedCategory) {
      return res.status(404).json({
        message: "Category not found or you don't have permission to update it",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      success: true,
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Category with this name already exists",
        success: false,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation Error",
        errors: messages,
        success: false,
      });
    }

    return res.status(500).json({
      message: "Server error while updating category",
      success: false,
      error: error.message,
    });
  }
};

const DeleteCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }

    const deletedCategory = await Category.findOneAndDelete({
      _id: id,
      seller: userId,
    });

    if (!deletedCategory) {
      return res.status(404).json({
        message: "Category not found or you don't have permission to delete it",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Category deleted successfully",
      success: true,
      category: deletedCategory,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      message: "Server error while deleting category",
      success: false,
      error: error.message,
    });
  }
};

const AddSubCategories = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;
    const userId = req.userId;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Sub-category name is required",
        success: false,
      });
    }

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        message: "Valid category ID is required",
        success: false,
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      seller: userId,
    });

    if (!category) {
      return res.status(404).json({
        message:
          "Category not found or you don't have permission to add sub-categories",
        success: false,
      });
    }

    const existingSubCategory = category.subCategories.find(
      (subCat) => subCat.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingSubCategory) {
      return res.status(400).json({
        message: "Sub-category with this name already exists in this category",
        success: false,
      });
    }

    const newSubCategory = {
      name: name.trim(),
      description: description || "",
    };

    category.subCategories.push(newSubCategory);
    await category.save();

    return res.status(201).json({
      message: "Sub-category added successfully",
      success: true,
      subCategory: newSubCategory,
      category,
    });
  } catch (error) {
    console.error("Error adding sub-category:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation Error",
        errors: messages,
        success: false,
      });
    }

    return res.status(500).json({
      message: "Server error while adding sub-category",
      success: false,
      error: error.message,
    });
  }
};

const UpdateSubCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid sub-category ID",
        success: false,
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Sub-category name is required",
        success: false,
      });
    }

    const category = await Category.findOne({
      seller: userId,
      "subCategories._id": id,
    });

    if (!category) {
      return res.status(404).json({
        message:
          "Sub-category not found or you don't have permission to update it",
        success: false,
      });
    }

    const duplicateSubCategory = category.subCategories.find(
      (subCat) =>
        subCat._id.toString() !== id &&
        subCat.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicateSubCategory) {
      return res.status(400).json({
        message:
          "Another sub-category with this name already exists in this category",
        success: false,
      });
    }

    const subCategoryIndex = category.subCategories.findIndex(
      (subCat) => subCat._id.toString() === id
    );

    if (subCategoryIndex === -1) {
      return res.status(404).json({
        message: "Sub-category not found",
        success: false,
      });
    }

    category.subCategories[subCategoryIndex].name = name.trim();
    category.subCategories[subCategoryIndex].description = description || "";

    await category.save();

    return res.status(200).json({
      message: "Sub-category updated successfully",
      success: true,
      subCategory: category.subCategories[subCategoryIndex],
      category,
    });
  } catch (error) {
    console.error("Error updating sub-category:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation Error",
        errors: messages,
        success: false,
      });
    }

    return res.status(500).json({
      message: "Server error while updating sub-category",
      success: false,
      error: error.message,
    });
  }
};

const DeleteSubCategoryByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid sub-category ID",
        success: false,
      });
    }

    const category = await Category.findOne({
      seller: userId,
      "subCategories._id": id,
    });

    if (!category) {
      return res.status(404).json({
        message:
          "Sub-category not found or you don't have permission to delete it",
        success: false,
      });
    }

    const updatedSubCategories = category.subCategories.filter(
      (subCat) => subCat._id.toString() !== id
    );

    if (updatedSubCategories.length === category.subCategories.length) {
      return res.status(404).json({
        message: "Sub-category not found",
        success: false,
      });
    }

    category.subCategories = updatedSubCategories;
    await category.save();

    return res.status(200).json({
      message: "Sub-category deleted successfully",
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error deleting sub-category:", error);
    return res.status(500).json({
      message: "Server error while deleting sub-category",
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// BANNER FUNCTIONS - ✅ UPDATED WITH HTTPS FIX
// ============================================

// Add new banner
const AddBanners = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, description, redirectUrl, position, isActive, endDate } =
      req.body;

    // Validate required fields
    if (!title || !req.file) {
      return res.status(400).json({
        message: "Title and image are required",
        success: false,
      });
    }

    // ✅ FIX: Proper protocol detection behind proxy
    const protocol =
      req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.get("host");

    // ✅ Always use HTTPS in production
    const finalProtocol =
      process.env.NODE_ENV === "production" ? "https" : protocol;

    const imageUrl = `${finalProtocol}://${host}/uploads/banners/${req.file.filename}`;

    console.log("📦 Creating banner with URL:", imageUrl);
    console.log("🔒 Protocol:", finalProtocol);
    console.log("🌐 Host:", host);

    // Create new banner
    const newBanner = new Banner({
      title: title.trim(),
      description: description || "",
      image: req.file.path,
      imageUrl: imageUrl,
      redirectUrl: redirectUrl || "",
      position: position || "home-top",
      isActive: isActive !== undefined ? isActive : true,
      startDate: new Date(),
      endDate: endDate || null,
      seller: userId,
    });

    await newBanner.save();

    return res.status(201).json({
      message: "Banner added successfully",
      success: true,
      banner: newBanner,
    });
  } catch (error) {
    console.error("Error adding banner:", error);

    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Banner with similar details already exists",
        success: false,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation Error",
        errors: messages,
        success: false,
      });
    }

    return res.status(500).json({
      message: "Server error while adding banner",
      success: false,
      error: error.message,
    });
  }
};

// Get all banners for a seller
const GetAdminBanners = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      activeOnly,
      position,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { seller: userId };

    // Apply filters
    if (activeOnly === "true") {
      query.isActive = true;
      query.$or = [{ endDate: null }, { endDate: { $gte: new Date() } }];
    }

    if (position) {
      query.position = position;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const banners = await Banner.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v")
      .lean();

    // ✅ Fix URLs to use HTTPS in production
    const fixedBanners = banners.map((banner) => {
      if (banner.imageUrl && process.env.NODE_ENV === "production") {
        banner.imageUrl = banner.imageUrl.replace("http://", "https://");
      }
      return banner;
    });

    const total = await Banner.countDocuments(query);

    return res.status(200).json({
      message: "Banners fetched successfully",
      success: true,
      banners: fixedBanners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching admin banners:", error);
    return res.status(500).json({
      message: "Server error while fetching banners",
      success: false,
      error: error.message,
    });
  }
};

// Get single banner by ID
const GetBannerByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const banner = await Banner.findOne({
      _id: id,
      seller: userId,
    })
      .select("-__v")
      .lean();

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found",
        success: false,
      });
    }

    // ✅ Fix URL to use HTTPS in production
    if (banner.imageUrl && process.env.NODE_ENV === "production") {
      banner.imageUrl = banner.imageUrl.replace("http://", "https://");
    }

    return res.status(200).json({
      message: "Banner fetched successfully",
      success: true,
      banner,
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return res.status(500).json({
      message: "Server error while fetching banner",
      success: false,
      error: error.message,
    });
  }
};

// Update banner by ID
const UpdateBannerByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      title,
      description,
      redirectUrl,
      position,
      isActive,
      endDate,
      sortOrder,
    } = req.body;

    // Find existing banner
    const existingBanner = await Banner.findOne({
      _id: id,
      seller: userId,
    });

    if (!existingBanner) {
      return res.status(404).json({
        message: "Banner not found",
        success: false,
      });
    }

    const updateData = {
      title: title || existingBanner.title,
      description:
        description !== undefined ? description : existingBanner.description,
      redirectUrl:
        redirectUrl !== undefined ? redirectUrl : existingBanner.redirectUrl,
      position: position || existingBanner.position,
      isActive: isActive !== undefined ? isActive : existingBanner.isActive,
      endDate: endDate !== undefined ? endDate : existingBanner.endDate,
      sortOrder: sortOrder !== undefined ? sortOrder : existingBanner.sortOrder,
    };

    // Handle new image upload if provided
    if (req.file) {
      // Delete old image file
      if (existingBanner.image && fs.existsSync(existingBanner.image)) {
        fs.unlink(existingBanner.image, (err) => {
          if (err) console.error("Error deleting old file:", err);
        });
      }

      // ✅ Use correct protocol for new image
      const protocol =
        process.env.NODE_ENV === "production" ? "https" : req.protocol;
      const host = req.get("host");

      updateData.image = req.file.path;
      updateData.imageUrl = `${protocol}://${host}/uploads/banners/${req.file.filename}`;

      console.log("📦 Updated banner with URL:", updateData.imageUrl);
    }

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    return res.status(200).json({
      message: "Banner updated successfully",
      success: true,
      banner: updatedBanner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);

    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        message: "Validation Error",
        errors: messages,
        success: false,
      });
    }

    return res.status(500).json({
      message: "Server error while updating banner",
      success: false,
      error: error.message,
    });
  }
};

// Delete banner by ID
const DeleteBannerByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const banner = await Banner.findOneAndDelete({
      _id: id,
      seller: userId,
    });

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found",
        success: false,
      });
    }

    // Delete image file
    if (banner.image && fs.existsSync(banner.image)) {
      fs.unlink(banner.image, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    return res.status(200).json({
      message: "Banner deleted successfully",
      success: true,
      banner,
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return res.status(500).json({
      message: "Server error while deleting banner",
      success: false,
      error: error.message,
    });
  }
};

// Toggle banner status
const ToggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const banner = await Banner.findOne({
      _id: id,
      seller: userId,
    });

    if (!banner) {
      return res.status(404).json({
        message: "Banner not found",
        success: false,
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    return res.status(200).json({
      message: `Banner ${
        banner.isActive ? "activated" : "deactivated"
      } successfully`,
      success: true,
      banner,
    });
  } catch (error) {
    console.error("Error toggling banner status:", error);
    return res.status(500).json({
      message: "Server error while updating banner status",
      success: false,
      error: error.message,
    });
  }
};

export {
  AddCategories,
  GetCategories,
  GetCategoryByID,
  UpdateCategoryByID,
  DeleteCategoryByID,
  AddSubCategories,
  UpdateSubCategoryByID,
  DeleteSubCategoryByID,
  AddBanners,
  GetAdminBanners,
  GetBannerByID,
  UpdateBannerByID,
  DeleteBannerByID,
  ToggleBannerStatus,
};
