import Product from "../model/product.schema.js";
import Order from "../model/order.schema.js";
import mongoose from "mongoose";

const AddProducts = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      gender,
      mrp,
      sellingPrice,
      specifications,
      variants,
      slug,
      tags,
    } = req.body;

    const userId = req.userId;

    // --- 1. Basic Field Validation ---
    if (!title || !category || !mrp || !sellingPrice || !variants || !slug) {
      return res.status(400).json({
        message:
          "Missing required fields: title, category, mrp, sellingPrice, variants, and slug.",
        success: false,
      });
    }

    // --- 2. Validate Tags (NEW) ---
    const validTags = ["new-arrival", "best-seller", "featured", "trending"];
    let sanitizedTags = [];

    if (tags && Array.isArray(tags)) {
      const invalidTags = tags.filter((tag) => !validTags.includes(tag));
      if (invalidTags.length > 0) {
        return res.status(400).json({
          message: `Invalid tags: ${invalidTags.join(
            ", "
          )}. Valid tags are: ${validTags.join(", ")}`,
          success: false,
        });
      }
      // Remove duplicates
      sanitizedTags = [...new Set(tags)];
    }

    // --- 3. Numeric Validation ---
    const numMrp = Number(mrp);
    const numSellingPrice = Number(sellingPrice);

    if (isNaN(numMrp) || isNaN(numSellingPrice)) {
      return res.status(400).json({
        message: "MRP and Selling Price must be valid numbers",
        success: false,
      });
    }

    if (numSellingPrice > numMrp) {
      return res.status(400).json({
        message: "Selling Price cannot be higher than MRP",
        success: false,
      });
    }

    // --- 4. Variant & SKU Validation ---
    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        message: "At least one color variant is required",
        success: false,
      });
    }

    const skuSet = new Set();

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      if (
        !variant.colorName ||
        !variant.hexCode ||
        !variant.images ||
        !variant.sizes
      ) {
        return res.status(400).json({
          message: `Variant ${i + 1} (Color: ${
            variant.colorName || "Unknown"
          }) is missing required fields.`,
          success: false,
        });
      }

      if (!Array.isArray(variant.images) || variant.images.length === 0) {
        return res.status(400).json({
          message: `Variant ${i + 1} (${
            variant.colorName
          }) must have at least one image`,
          success: false,
        });
      }

      if (!Array.isArray(variant.sizes) || variant.sizes.length === 0) {
        return res.status(400).json({
          message: `Variant ${i + 1} (${
            variant.colorName
          }) must have at least one size`,
          success: false,
        });
      }

      for (const sizeObj of variant.sizes) {
        if (!sizeObj.size || !sizeObj.sku || sizeObj.stock === undefined) {
          return res.status(400).json({
            message: `A size entry in ${variant.colorName} is missing size, sku, or stock`,
            success: false,
          });
        }

        if (skuSet.has(sizeObj.sku)) {
          return res.status(400).json({
            message: `Duplicate SKU detected in request: ${sizeObj.sku}. SKUs must be unique.`,
            success: false,
          });
        }
        skuSet.add(sizeObj.sku);
      }
    }

    // --- 5. Logic Calculations ---
    let discountPercent = 0;
    if (numMrp > 0) {
      discountPercent = Math.round(((numMrp - numSellingPrice) / numMrp) * 100);
    }

    const cleanSlug = slug.toLowerCase().split(" ").join("-");

    // --- 6. Create Product ---
    const newProduct = new Product({
      title,
      slug: cleanSlug,
      description: description || "",
      category,
      subCategory: subCategory || null,
      gender: gender || "Unisex",
      mrp: numMrp,
      sellingPrice: numSellingPrice,
      discount: discountPercent,
      specifications: specifications || {
        upperMaterial: null,
        soleMaterial: null,
        insole: null,
        closure: null,
      },
      variants,
      tags: sanitizedTags, // NEW: Add tags
      seller: userId,
      isDeleted: false,
    });

    await newProduct.save();

    return res.status(201).json({
      message: "Product added successfully",
      success: true,
      productId: newProduct._id,
      tags: sanitizedTags, // NEW: Return tags in response
    });
  } catch (error) {
    console.error("Error adding product:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        message: `Duplicate Value Error: The ${field} '${value}' already exists in the system.`,
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
      message: "Server error while adding product",
      success: false,
      error: error.message,
    });
  }
};

const GetProductsForSeller = async (req, res) => {
  try {
    const userId = req.userId;
    const { tag, tags, status } = req.query; // NEW: Add tag filters

    const query = { seller: userId, isDeleted: false };

    // NEW: Single tag filter
    if (tag) {
      query.tags = tag;
    }

    // NEW: Multiple tags filter (comma-separated)
    if (tags) {
      const tagsArray = tags.split(",").map((t) => t.trim());
      query.tags = { $in: tagsArray };
    }

    // Status filter
    if (status === "active") {
      query.isArchived = { $ne: true };
    } else if (status === "archived") {
      query.isArchived = true;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Calculate total stock for each product
    const productsWithStats = products.map((product) => {
      let totalStock = 0;
      if (product.variants) {
        product.variants.forEach((variant) => {
          if (variant.sizes) {
            variant.sizes.forEach((size) => {
              totalStock += size.stock || 0;
            });
          }
        });
      }
      return {
        ...product.toObject(),
        totalStock,
      };
    });

    return res.json({
      products: productsWithStats,
      success: true,
      total: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const GetProductByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Ensure the seller can only fetch their own product
    const product = await Product.findOne({
      _id: id,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const UpdateProductByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    // Find product belonging to logged-in seller
    const product = await Product.findOne({
      _id: id,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // NEW: Validate tags if provided
    if (updateData.tags !== undefined) {
      const validTags = ["new-arrival", "best-seller", "featured", "trending"];

      if (!Array.isArray(updateData.tags)) {
        return res.status(400).json({
          success: false,
          message: "Tags must be an array",
        });
      }

      const invalidTags = updateData.tags.filter(
        (tag) => !validTags.includes(tag)
      );
      if (invalidTags.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid tags: ${invalidTags.join(
            ", "
          )}. Valid tags are: ${validTags.join(", ")}`,
        });
      }

      // Remove duplicates
      updateData.tags = [...new Set(updateData.tags)];
    }

    // Add updatedAt timestamp automatically
    updateData.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product by ID:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const DeleteProductByID = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Ensure seller owns this product
    const product = await Product.findOne({
      _id: id,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Soft delete instead of removing permanently
    await Product.findByIdAndUpdate(id, {
      isDeleted: true,
      updatedAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Product deleted successfully (soft delete)",
    });
  } catch (error) {
    console.error("Error deleting product by ID:", error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

const GetSellerOrders = async (req, res) => {
  try {
    const sellerId = req.userId;
    const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: "Seller authentication required",
      });
    }

    // Build filter query
    let filterQuery = { "products.seller": sellerId };

    // Add status filter if provided
    if (status && status !== "all") {
      filterQuery["products.productStatus"] = status;
    }

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      filterQuery.createdAt = {};
      if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filterQuery.createdAt.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filterQuery);

    // Find orders with pagination and filtering
    const orders = await Order.find(filterQuery)
      .populate("user", "name email phone")
      .populate("products.product", "title imgUrl category size")
      .populate("products.seller", "name email brandName mobile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform the data
    const sellerOrders = orders
      .map((order) => {
        const sellerProducts = order.products.filter(
          (product) =>
            product.seller &&
            product.seller._id.toString() === sellerId.toString()
        );

        const sellerTotal = sellerProducts.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          _id: order._id,
          orderId: order.orderId,
          user: order.user,
          products: sellerProducts,
          totalAmount: sellerTotal,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          orderDate: order.orderDate,
          expectedDelivery: order.expectedDelivery,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      })
      .filter((order) => order.products.length > 0);

    res.json({
      success: true,
      message: "Seller orders fetched successfully",
      orders: sellerOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
        hasNext: page < Math.ceil(totalOrders / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller orders: " + error.message,
    });
  }
};

const UpdateProductStatus = async (req, res) => {
  try {
    const { orderId, productId, productStatus } = req.body;
    const sellerId = req.userId; // From your tokenDecoder middleware

    console.log("=== Update Product Status Request ===");
    console.log("Order ID:", orderId);
    console.log("Product ID:", productId);
    console.log("New Status:", productStatus);
    console.log("Seller ID:", sellerId);

    // Validate required fields
    if (!orderId || !productId || !productStatus) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Product ID, and Product Status are required",
      });
    }

    // Validate status value
    const validStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(productStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Find the order by orderId (the custom order ID like "ORD-12345678-ABCD")
    const order = await Order.findOne({ orderId: orderId });

    if (!order) {
      console.log("Order not found with orderId:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("Found order:", order._id);
    console.log("Order products count:", order.products.length);

    // Find the product index in the order
    let productIndex = -1;

    for (let i = 0; i < order.products.length; i++) {
      const product = order.products[i];

      // Get the product ID (handle both populated and non-populated cases)
      const orderProductId =
        product.product?._id?.toString() || product.product?.toString();
      const orderSellerId =
        product.seller?._id?.toString() || product.seller?.toString();

      console.log(
        `Product ${i}: productId=${orderProductId}, sellerId=${orderSellerId}`
      );

      // Check if this is the product we're looking for AND belongs to this seller
      if (orderProductId === productId.toString()) {
        // Verify seller ownership
        if (orderSellerId === sellerId.toString()) {
          productIndex = i;
          break;
        } else {
          console.log("Product found but seller mismatch");
          return res.status(403).json({
            success: false,
            message: "You can only update status for your own products",
          });
        }
      }
    }

    if (productIndex === -1) {
      console.log("Product not found in order");
      return res.status(404).json({
        success: false,
        message: "Product not found in this order",
      });
    }

    // Update the product status
    const oldStatus = order.products[productIndex].productStatus;
    order.products[productIndex].productStatus = productStatus;

    console.log(`Updating status from "${oldStatus}" to "${productStatus}"`);

    // Optionally update overall order status based on all product statuses
    const allStatuses = order.products.map((p) => p.productStatus);

    if (allStatuses.every((s) => s === "Delivered")) {
      order.orderStatus = "Delivered";
    } else if (allStatuses.every((s) => s === "Cancelled")) {
      order.orderStatus = "Cancelled";
    } else if (allStatuses.some((s) => s === "Shipped")) {
      order.orderStatus = "Shipped";
    } else if (allStatuses.some((s) => s === "Confirmed")) {
      order.orderStatus = "Confirmed";
    } else {
      order.orderStatus = "Pending";
    }

    // Save the updated order
    await order.save();

    console.log("Order saved successfully");

    res.json({
      success: true,
      message: `Product status updated from "${oldStatus}" to "${productStatus}"`,
      order: {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        products: order.products,
      },
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product status: " + error.message,
    });
  }
};

// ============================================
// NEW: Delete Single Variant from Product
// ============================================
const DeleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const userId = req.userId;

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(variantId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product or variant ID",
      });
    }

    // Find the product
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Find the variant
    const variantIndex = product.variants.findIndex(
      (v) => v._id.toString() === variantId
    );

    if (variantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    // Check if this is the last active variant
    const activeVariants = product.variants.filter((v) => !v.isDeleted);
    if (activeVariants.length <= 1) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete the last variant. Delete the entire product instead.",
      });
    }

    // Soft delete the variant
    product.variants[variantIndex].isDeleted = true;
    product.updatedAt = new Date();

    await product.save();

    // Return updated product without deleted variants
    const updatedProduct = await Product.findById(productId);
    const filteredProduct = {
      ...updatedProduct.toObject(),
      variants: updatedProduct.variants.filter((v) => !v.isDeleted),
    };

    return res.status(200).json({
      success: true,
      message: "Variant deleted successfully",
      product: filteredProduct,
    });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting variant",
      error: error.message,
    });
  }
};

// ============================================
// NEW: Delete Single Size from Variant
// ============================================
const DeleteSize = async (req, res) => {
  try {
    const { productId, variantId, sizeId } = req.params;
    const userId = req.userId;

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(variantId) ||
      !mongoose.Types.ObjectId.isValid(sizeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product, variant, or size ID",
      });
    }

    // Find the product
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Find the variant
    const variant = product.variants.id(variantId);
    if (!variant || variant.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    // Find the size
    const sizeIndex = variant.sizes.findIndex(
      (s) => s._id.toString() === sizeId
    );

    if (sizeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    // Check if this is the last active size
    const activeSizes = variant.sizes.filter((s) => !s.isDeleted);
    if (activeSizes.length <= 1) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete the last size. Delete the entire variant instead.",
      });
    }

    // Soft delete the size
    variant.sizes[sizeIndex].isDeleted = true;
    product.updatedAt = new Date();

    await product.save();

    // Return updated product
    const updatedProduct = await Product.findById(productId);

    return res.status(200).json({
      success: true,
      message: "Size deleted successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error deleting size:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting size",
      error: error.message,
    });
  }
};

// ============================================
// NEW: Archive/Unarchive Single Variant
// ============================================
const ArchiveVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { isArchived } = req.body;
    const userId = req.userId;

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(variantId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product or variant ID",
      });
    }

    // Find the product
    const product = await Product.findOne({
      _id: productId,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Find the variant
    const variant = product.variants.id(variantId);
    if (!variant || variant.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    // Update archive status
    variant.isArchived = isArchived;
    variant.archivedAt = isArchived ? new Date() : null;
    product.updatedAt = new Date();

    await product.save();

    return res.status(200).json({
      success: true,
      message: `Variant ${isArchived ? "archived" : "unarchived"} successfully`,
      product: product,
    });
  } catch (error) {
    console.error("Error archiving variant:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while archiving variant",
      error: error.message,
    });
  }
};

// ============================================
// UPDATED: GetProductDetails with full variant info
// ============================================
const GetProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      _id: id,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Filter out deleted variants and sizes, calculate stats
    let totalStock = 0;
    let colorVariants = 0;
    let sizeOptions = 0;
    let archivedVariants = 0;

    const activeVariants = [];

    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        if (variant.isDeleted) return; // Skip deleted variants

        const activeSizes = variant.sizes?.filter((s) => !s.isDeleted) || [];

        if (activeSizes.length === 0) return; // Skip variants with no active sizes

        colorVariants++;
        if (variant.isArchived) archivedVariants++;

        const variantStock = activeSizes.reduce(
          (sum, size) => sum + (size.stock || 0),
          0
        );
        totalStock += variantStock;
        sizeOptions += activeSizes.length;

        activeVariants.push({
          ...variant.toObject(),
          sizes: activeSizes,
          totalStock: variantStock,
        });
      });
    }

    // Get order stats for this product
    const orderStats = await Order.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.product": new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalQuantitySold: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        variants: activeVariants, // Only active variants with active sizes
        stats: {
          totalStock,
          colorVariants,
          sizeOptions,
          archivedVariants,
          totalOrders: orderStats[0]?.totalOrders || 0,
          totalQuantitySold: orderStats[0]?.totalQuantitySold || 0,
          totalRevenue: orderStats[0]?.totalRevenue || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching product details",
      error: error.message,
    });
  }
};

// Duplicate Product
const DuplicateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeTags = true } = req.body; // NEW: Option to include tags
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const originalProduct = await Product.findOne({
      _id: id,
      seller: userId,
      isDeleted: false,
    });

    if (!originalProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    const duplicateData = originalProduct.toObject();

    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    duplicateData.title = `${originalProduct.title} (Copy)`;
    duplicateData.slug = `${originalProduct.slug}-copy-${Date.now()}`;
    duplicateData.isArchived = false;
    duplicateData.isDeleted = false;

    // NEW: Handle tags based on option
    if (!includeTags) {
      duplicateData.tags = [];
    }
    // If includeTags is true, tags are preserved from original

    if (duplicateData.variants && Array.isArray(duplicateData.variants)) {
      duplicateData.variants = duplicateData.variants.map((variant) => {
        const newVariant = { ...variant };
        newVariant._id = new mongoose.Types.ObjectId();

        if (newVariant.sizes && Array.isArray(newVariant.sizes)) {
          newVariant.sizes = newVariant.sizes.map((size) => ({
            ...size,
            _id: new mongoose.Types.ObjectId(),
            sku: `${size.sku}-COPY-${Date.now()}`,
            stock: 0,
          }));
        }

        return newVariant;
      });
    }

    const newProduct = new Product(duplicateData);
    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: "Product duplicated successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error duplicating product:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate value error: ${field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while duplicating product",
      error: error.message,
    });
  }
};

// Archive/Unarchive Product
const ArchiveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find product
    const product = await Product.findOne({
      _id: id,
      seller: userId,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Update archive status
    const updateData = {
      isArchived: isArchived,
      updatedAt: new Date(),
    };

    // If archiving, also set archivedAt timestamp
    if (isArchived) {
      updateData.archivedAt = new Date();
    } else {
      updateData.archivedAt = null;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: `Product ${isArchived ? "archived" : "unarchived"} successfully`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error archiving product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while archiving product",
      error: error.message,
    });
  }
};
const GetDashboardStats = async (req, res) => {
  try {
    const sellerId = req.userId;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: "Seller authentication required",
      });
    }

    // Get all orders containing this seller's products
    const orderStats = await Order.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.seller": new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalIncome: {
            $sum: { $multiply: ["$products.price", "$products.quantity"] },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ["$products.productStatus", "Pending"] }, 1, 0],
            },
          },
          confirmedCount: {
            $sum: {
              $cond: [{ $eq: ["$products.productStatus", "Confirmed"] }, 1, 0],
            },
          },
          shippedCount: {
            $sum: {
              $cond: [{ $eq: ["$products.productStatus", "Shipped"] }, 1, 0],
            },
          },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ["$products.productStatus", "Delivered"] }, 1, 0],
            },
          },
          cancelledCount: {
            $sum: {
              $cond: [{ $eq: ["$products.productStatus", "Cancelled"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get product stats
    const productStats = await Product.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $ne: ["$isArchived", true] }, 1, 0] },
          },
          archivedProducts: {
            $sum: { $cond: [{ $eq: ["$isArchived", true] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalIncome: 0,
      pendingCount: 0,
      confirmedCount: 0,
      shippedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0,
    };

    const products = productStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      archivedProducts: 0,
    };

    const completedOrders = stats.deliveredCount;
    const pendingOrders =
      stats.pendingCount + stats.confirmedCount + stats.shippedCount;

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      stats: {
        orders: {
          total: stats.totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
          cancelled: stats.cancelledCount,
        },
        income: {
          total: stats.totalIncome,
          formatted: `₹${stats.totalIncome.toLocaleString("en-IN")}`,
        },
        products: {
          total: products.totalProducts,
          active: products.activeProducts,
          archived: products.archivedProducts,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard stats",
      error: error.message,
    });
  }
};

export {
  AddProducts,
  GetProductsForSeller,
  GetProductByID,
  UpdateProductByID,
  DeleteProductByID,
  GetSellerOrders,
  UpdateProductStatus,
  GetProductDetails,
  DuplicateProduct,
  ArchiveProduct,
  DeleteVariant,
  DeleteSize,
  ArchiveVariant,
  GetDashboardStats,
};
