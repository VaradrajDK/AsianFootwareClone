import { Router } from "express";
import {
  GetAllProducts,
  AddToCart,
  GetCartProducts,
  CreateOrders,
  GetAllOrders,
  GetOrderById,
} from "../controllers/product.controllers.js";

const producRoute = Router();

producRoute.get("/get-Products", GetAllProducts);
producRoute.post("/addToCart", AddToCart);
producRoute.get("/getcarproducts", GetCartProducts);
producRoute.post("/createOrders", CreateOrders);
producRoute.get("/getOrders", GetAllOrders);
producRoute.get("/getOrderById/:id", GetOrderById);

export default producRoute;
