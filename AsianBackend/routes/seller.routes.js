// routes/seller.routes.js
import { Router } from "express";
import {
  AddProducts,
  GetProductsForSeller,
  GetProductByID,
  UpdateProductByID,
  DeleteProductByID,
  GetSellerOrders,
  UpdateProductStatus,
  DuplicateProduct,
  ArchiveProduct,
  GetProductDetails,
  DeleteVariant,
  DeleteSize,
  ArchiveVariant,
  GetDashboardStats,
} from "../controllers/seller.controllers.js";

import {
  AddCategories,
  GetCategories,
  UpdateCategoryByID,
  DeleteCategoryByID,
  GetCategoryByID,
  AddSubCategories,
  UpdateSubCategoryByID,
  DeleteSubCategoryByID,
  AddBanners,
  GetAdminBanners,
  GetBannerByID,
  UpdateBannerByID,
  DeleteBannerByID,
  ToggleBannerStatus,
} from "../controllers/settings.controller.js";

import upload from "../middlewears/multerConfig.js";

const sellerRoute = Router();

sellerRoute.get("/dashboard-stats", GetDashboardStats);
// Product Routes
sellerRoute.post("/add-Products", AddProducts);
sellerRoute.get("/get-Products", GetProductsForSeller);
sellerRoute.get("/get-ProductsByID/:id", GetProductByID);
sellerRoute.put("/UpdateProduct/:id", UpdateProductByID);
sellerRoute.delete("/DeleteProduct/:id", DeleteProductByID);

// Product Actions
sellerRoute.get("/product-details/:id", GetProductDetails);
sellerRoute.post("/product-duplicate/:id", DuplicateProduct);
sellerRoute.patch("/product-archive/:id", ArchiveProduct);

// NEW: Variant-level operations
sellerRoute.delete("/product/:productId/variant/:variantId", DeleteVariant);
sellerRoute.patch(
  "/product/:productId/variant/:variantId/archive",
  ArchiveVariant
);
sellerRoute.delete(
  "/product/:productId/variant/:variantId/size/:sizeId",
  DeleteSize
);

// Order Routes
sellerRoute.get("/getSellerOrders", GetSellerOrders);
sellerRoute.put("/product-status", UpdateProductStatus);

// Category Routes
sellerRoute.post("/add-category", AddCategories);
sellerRoute.get("/get-categories", GetCategories);
sellerRoute.put("/update-category/:id", UpdateCategoryByID);
sellerRoute.delete("/delete-category/:id", DeleteCategoryByID);
sellerRoute.get("/get-category/:id", GetCategoryByID);

// Subcategory Routes
sellerRoute.post("/add-subcategory", AddSubCategories);
sellerRoute.put("/update-subcategory/:id", UpdateSubCategoryByID);
sellerRoute.delete("/delete-subcategory/:id", DeleteSubCategoryByID);

// Banner Routes
sellerRoute.post("/add-banners", upload.single("image"), AddBanners);
sellerRoute.get("/get-banners", GetAdminBanners);
sellerRoute.get("/get-banner/:id", GetBannerByID);
sellerRoute.put(
  "/update-banners/:id",
  upload.single("image"),
  UpdateBannerByID
);
sellerRoute.delete("/delete-banners/:id", DeleteBannerByID);
sellerRoute.patch("/toggle-status/:id", ToggleBannerStatus);

export default sellerRoute;
