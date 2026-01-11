import Banner from "../model/Banner.schema.js";
import Product from "../model/product.schema.js";

// ============================================
// HELPER: Get Backend URL
// ============================================
const getBackendUrl = (req) => {
  // Try environment variable first
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }

  // Build from request headers (works for both local and deployed)
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  return `${protocol}://${host}`;
};

// ============================================
// GET PUBLIC BANNERS
// ============================================
const GetPublicBanners = async (req, res) => {
  try {
    const { limit } = req.query;
    const { position } = req.params; // Get position from params if provided

    // Build query for active banners
    const query = {
      isActive: true,
    };

    // Filter by position if provided
    if (position) {
      query.position = position;
    }

    const bannerLimit = parseInt(limit) || 10;

    const banners = await Banner.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(bannerLimit)
      .select("title subtitle image link position order isActive")
      .lean();

    // Get the backend URL
    const backendUrl = getBackendUrl(req);
    console.log("🌐 Backend URL:", backendUrl);
    console.log("📦 Found", banners.length, "banners");

    // Format banners with full image URLs
    const formattedBanners = banners.map((banner) => {
      let imageUrl = banner.image;

      // Add full URL if it's a relative path
      if (imageUrl && imageUrl.startsWith("/uploads")) {
        imageUrl = `${backendUrl}${imageUrl}`;
      }

      // Force HTTPS in production
      if (imageUrl && process.env.NODE_ENV === "production") {
        imageUrl = imageUrl.replace("http://", "https://");
      }

      console.log("🖼️ Banner:", banner.title, "→", imageUrl);

      return {
        _id: banner._id,
        id: banner._id,
        title: banner.title,
        subtitle: banner.subtitle,
        image: banner.image,
        imageUrl: imageUrl,
        link: banner.link,
        position: banner.position,
        order: banner.order,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      banners: formattedBanners,
      count: formattedBanners.length,
    });
  } catch (error) {
    console.error("❌ Error fetching public banners:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
      error: error.message,
    });
  }
};

// ============================================
// GET BANNERS COUNT
// ============================================
const GetBannersCount = async (req, res) => {
  try {
    const count = await Banner.countDocuments({
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      message: "Active banners count",
      count,
    });
  } catch (error) {
    console.error("Error counting banners:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to count banners",
      error: error.message,
    });
  }
};

// ============================================
// GET PRODUCTS BY TAG
// ============================================
const GetProductsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const {
      page = 1,
      limit = 12,
      category,
      gender,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    console.log("=== GET PRODUCTS BY TAG ===");
    console.log("Requested tag:", tag);

    const validTags = ["new-arrival", "best-seller", "featured", "trending"];

    if (!validTags.includes(tag)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tag. Valid tags are: ${validTags.join(", ")}`,
      });
    }

    // ✅ FIXED: Query tags array correctly
    const query = {
      tags: { $in: [tag] }, // ← This searches within the array
      isDeleted: false,
      isArchived: false,
    };

    // OR even simpler (MongoDB automatically searches arrays):
    // const query = {
    //   tags: tag, // ← This also works for arrays
    //   isDeleted: false,
    //   isArchived: false,
    // };

    console.log("Query:", JSON.stringify(query, null, 2));

    if (category) {
      query.category = category;
    }

    if (gender) {
      query.gender = gender;
    }

    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    console.log("Executing query...");

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("seller", "name brandName")
        .lean(),
      Product.countDocuments(query),
    ]);

    console.log("✅ Found", products.length, "products with tag:", tag);
    console.log("Total matching products:", total);

    // Log first product for debugging
    if (products.length > 0) {
      console.log("First product:", {
        title: products[0].title,
        tags: products[0].tags,
        _id: products[0]._id,
      });
    }

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
        ...product,
        totalStock,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Products with tag '${tag}' fetched successfully`,
      tag,
      products: productsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: page < Math.ceil(total / parseInt(limit)),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching products by tag:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      error: error.message,
    });
  }
};

export { GetPublicBanners, GetBannersCount, GetProductsByTag };
