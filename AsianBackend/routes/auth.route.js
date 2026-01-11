import { Router } from "express";
import {
  Login,
  Register,
  getLoggedInUser,
  Logout,
} from "../controllers/auth.controller.js";
import tokenDecoder from "../middlewears/tokenMiddlewears.js";

const authRouter = Router();

authRouter.post("/login", Login);
authRouter.post("/register", Register);
authRouter.get("/getLoggedInUser", tokenDecoder, getLoggedInUser);
authRouter.post("/logout", Logout);

export default authRouter;
