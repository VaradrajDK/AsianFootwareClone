// routes/admin.routes.js
import { Router } from "express";
import {
  // Dashboard
  GetDashboardStats,
  GetRecentActivity,

  // User Management (Original)
  GetAllUsers,
  GetUserByID,
  UpdateUserByID,
  DeleteUserByID,
  ToggleUserStatus,

  // Unified User Management (All Roles)
  GetAllRolesUsers,
  GetUserByIDUnified,
  CreateUserUnified,
  UpdateUserByIDUnified,
  ToggleUserStatusUnified,
  DeleteUserByIDUnified,

  // Seller Management
  GetAllSellers,
  GetSellerByID,
  UpdateSellerByID,
  DeleteSellerByID,
  ToggleSellerStatus,
  VerifySeller,

  // Product Management
  GetAllProducts,
  GetProductByID,
  CreateProduct,
  UpdateProductByID,
  DeleteProductByID,
  ToggleProductStatus,
  ApproveProduct,
  FeatureProduct,

  // Order Management
  GetAllOrders,
  GetOrderByID,
  UpdateOrderByID,
  UpdateOrderStatus,
  DeleteOrderByID,

  // Category Management
  GetAllCategories,
  GetCategoryByID,
  CreateCategory,
  UpdateCategoryByID,
  DeleteCategoryByID,

  // Banner Management
  GetAllBanners,
  GetBannerByID,
  CreateBanner,
  UpdateBannerByID,
  DeleteBannerByID,
  ToggleBannerStatus,

  // Reports & Analytics
  GetSalesReport,
  GetUserReport,
  GetProductReport,
  GetSellerReport,
} from "../controllers/admin.controllers.js";

import upload from "../middlewears/multerConfig.js";

const adminRoute = Router();

// ==================== DASHBOARD ====================
adminRoute.get("/dashboard", GetDashboardStats);
adminRoute.get("/recent-activity", GetRecentActivity);

// ==================== UNIFIED USER MANAGEMENT ====================
adminRoute.get("/all-users", GetAllRolesUsers);
adminRoute.post("/all-users", CreateUserUnified);
adminRoute.get("/all-users/:id", GetUserByIDUnified);
adminRoute.put("/all-users/:id", UpdateUserByIDUnified);
adminRoute.delete("/all-users/:id", DeleteUserByIDUnified);
adminRoute.patch("/all-users/:id/toggle-status", ToggleUserStatusUnified);

// ==================== USER MANAGEMENT ====================
adminRoute.get("/users", GetAllUsers);
adminRoute.get("/users/:id", GetUserByID);
adminRoute.put("/users/:id", UpdateUserByID);
adminRoute.delete("/users/:id", DeleteUserByID);
adminRoute.patch("/users/:id/toggle-status", ToggleUserStatus);

// ==================== SELLER MANAGEMENT ====================
adminRoute.get("/sellers", GetAllSellers);
adminRoute.get("/sellers/:id", GetSellerByID);
adminRoute.put("/sellers/:id", UpdateSellerByID);
adminRoute.delete("/sellers/:id", DeleteSellerByID);
adminRoute.patch("/sellers/:id/toggle-status", ToggleSellerStatus);
adminRoute.patch("/sellers/:id/verify", VerifySeller);

// ==================== PRODUCT MANAGEMENT ====================
adminRoute.get("/products", GetAllProducts);
adminRoute.post("/products", CreateProduct); // ← CREATE PRODUCT ROUTE
adminRoute.get("/products/:id", GetProductByID);
adminRoute.put("/products/:id", UpdateProductByID);
adminRoute.delete("/products/:id", DeleteProductByID);
adminRoute.patch("/products/:id/toggle-status", ToggleProductStatus);
adminRoute.patch("/products/:id/approve", ApproveProduct);
adminRoute.patch("/products/:id/feature", FeatureProduct);

// ==================== ORDER MANAGEMENT ====================
adminRoute.get("/orders", GetAllOrders);
adminRoute.get("/orders/:id", GetOrderByID);
adminRoute.put("/orders/:id", UpdateOrderByID);
adminRoute.patch("/orders/:id/status", UpdateOrderStatus);
adminRoute.delete("/orders/:id", DeleteOrderByID);

// ==================== CATEGORY MANAGEMENT ====================
adminRoute.get("/categories", GetAllCategories);
adminRoute.get("/categories/:id", GetCategoryByID);
adminRoute.post("/categories", CreateCategory);
adminRoute.put("/categories/:id", UpdateCategoryByID);
adminRoute.delete("/categories/:id", DeleteCategoryByID);

// ==================== BANNER MANAGEMENT ====================
adminRoute.get("/banners", GetAllBanners);
adminRoute.get("/banners/:id", GetBannerByID);
adminRoute.post("/banners", upload.single("image"), CreateBanner);
adminRoute.put("/banners/:id", upload.single("image"), UpdateBannerByID);
adminRoute.delete("/banners/:id", DeleteBannerByID);
adminRoute.patch("/banners/:id/toggle-status", ToggleBannerStatus);

// ==================== REPORTS & ANALYTICS ====================
adminRoute.get("/reports/sales", GetSalesReport);
adminRoute.get("/reports/users", GetUserReport);
adminRoute.get("/reports/products", GetProductReport);
adminRoute.get("/reports/sellers", GetSellerReport);

export default adminRoute;
