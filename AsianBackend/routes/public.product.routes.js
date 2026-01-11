import { Router } from "express";
import {
  GetAllProducts,
  GetSingleProduct,
  GetProductsByCategory,
  GetProductsByGender,
  SearchProducts,
  GetFilterOptions,
} from "../controllers/PublicProduct.controllers.js";

const publicProductRouter = Router();

// Public product routes (no authentication required)
publicProductRouter.get("/products", GetAllProducts); // Get all products with filters
publicProductRouter.get("/products/search", SearchProducts); // Search products
publicProductRouter.get("/products/:id", GetSingleProduct); // Get single product by ID or slug
publicProductRouter.get("/products/category/:category", GetProductsByCategory); // Get products by category
publicProductRouter.get("/products/gender/:gender", GetProductsByGender); // Get products by gender
publicProductRouter.get("/products/filters/options", GetFilterOptions); // Get filter options

export default publicProductRouter;
