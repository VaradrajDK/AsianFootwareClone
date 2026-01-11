import { Router } from "express";
import {
  GetPublicBanners,
  GetBannersCount,
  GetProductsByTag,
} from "../controllers/public.controllers.js";

const publicRouter = Router();

// Public banner routes (no authentication required)
publicRouter.get("/banners", GetPublicBanners); // Get all active banners
publicRouter.get("/banners/count", GetBannersCount); // Get count of active banners
publicRouter.get("/banners/:position", GetPublicBanners); // Get banners by position
publicRouter.get("/products/tag/:tag", GetProductsByTag); // Get products by tag

export default publicRouter;
