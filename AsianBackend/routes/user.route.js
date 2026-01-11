// routes/user.route.js
import { Router } from "express";
import {
  GetUserInfo,
  UpdateUserProfile,
  AddAddress,
  UpdateAddress,
  RemoveAddress,
  SetDefaultAddress,
} from "../controllers/user.controller.js";
import tokenDecoder from "../middlewears/tokenMiddlewears.js";

const userRouter = Router();

userRouter.use(tokenDecoder);

userRouter.get("/profile/:id", GetUserInfo);
userRouter.put("/profile/:id", UpdateUserProfile);
userRouter.post("/address/:id", AddAddress);
userRouter.put("/address/:id/:addressId", UpdateAddress);
userRouter.delete("/address/:id/:addressId", RemoveAddress);
userRouter.patch("/address/:id/:addressId/default", SetDefaultAddress);

export default userRouter;
