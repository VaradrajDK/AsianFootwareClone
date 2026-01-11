// controllers/user.controller.js
import User from "../model/user.schema.js";
import mongoose from "mongoose";

// Get User Info
export const GetUserInfo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Update User Profile
export const UpdateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dob, gender, alternateMobile } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, dob, gender, alternateMobile, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Add New Address
export const AddAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address, city, state, pincode, mobile, isDefault, label } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const shouldBeDefault = user.addresses.length === 0 ? true : isDefault;

    user.addresses.push({
      address,
      city,
      state,
      pincode,
      mobile,
      isDefault: shouldBeDefault,
      label: label || "home",
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error adding address:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Update Address
export const UpdateAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { address, city, state, pincode, mobile, label } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      address,
      city,
      state,
      pincode,
      mobile,
      label,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Remove Address
export const RemoveAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const addressToRemove = user.addresses.find(
      (addr) => addr._id.toString() === addressId
    );

    if (!addressToRemove) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressId
    );

    if (addressToRemove.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address removed successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error removing address:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Set Default Address
export const SetDefaultAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(addressId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
