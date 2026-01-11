import Cart from "../model/CartSchema.js";
import Product from "../model/product.schema.js";
import Order from "../model/order.schema.js";
import Seller from "../model/seller.schema.js"; // Import Seller model

// Get all products
const GetAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });

    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add product to cart - FIXED VERSION
const AddToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, action, size, color } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "ProductId is required" });
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Check stock based on variants structure
    let isInStock = false;
    let availableStock = 0;

    if (product.variants && product.variants.length > 0) {
      // Find the variant (by color if provided, otherwise first variant)
      let targetVariant = product.variants[0];

      if (color) {
        const colorVariant = product.variants.find(
          (v) =>
            v.colorName && v.colorName.toLowerCase() === color.toLowerCase()
        );
        if (colorVariant) {
          targetVariant = colorVariant;
        }
      }

      // Check size stock within the variant
      if (size && targetVariant.sizes) {
        const sizeObj = targetVariant.sizes.find(
          (s) => s.size && s.size.toString() === size.toString()
        );
        if (sizeObj && sizeObj.stock > 0) {
          isInStock = true;
          availableStock = sizeObj.stock;
        }
      } else {
        // If no size specified, check if any size has stock
        if (targetVariant.sizes) {
          const anyInStock = targetVariant.sizes.some((s) => s.stock > 0);
          if (anyInStock) {
            isInStock = true;
            availableStock = targetVariant.sizes.reduce(
              (sum, s) => sum + (s.stock || 0),
              0
            );
          }
        }
      }
    } else {
      // Fallback to old structure
      if (product.inStock !== false && product.quantity > 0) {
        isInStock = true;
        availableStock = product.quantity;
      } else if (product.inStock !== false) {
        // If no quantity field, assume in stock
        isInStock = true;
        availableStock = 999;
      }
    }

    // Handle different actions
    if (action === "remove") {
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res
          .status(404)
          .json({ success: false, message: "Cart not found" });
      }

      const initialLength = cart.products.length;
      cart.products = cart.products.filter(
        (p) =>
          !(p.product.toString() === productId && (!size || p.size === size))
      );

      if (cart.products.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: "Product not found in cart",
        });
      }

      await cart.save();

      const populatedCart = await Cart.findOne({ user: userId }).populate(
        "products.product"
      );

      return res.status(200).json({
        success: true,
        message: "Product removed from cart",
        cart: populatedCart,
      });
    } else if (action === "update") {
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        return res
          .status(404)
          .json({ success: false, message: "Cart not found" });
      }

      const productIndex = cart.products.findIndex(
        (p) => p.product.toString() === productId && (!size || p.size === size)
      );

      if (productIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found in cart" });
      }

      if (quantity <= 0) {
        cart.products.splice(productIndex, 1);
      } else {
        if (quantity > availableStock) {
          return res.status(400).json({
            success: false,
            message: `Only ${availableStock} items available in stock`,
          });
        }
        cart.products[productIndex].quantity = quantity;
      }

      await cart.save();

      const populatedCart = await Cart.findOne({ user: userId }).populate(
        "products.product"
      );

      return res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        cart: populatedCart,
      });
    } else {
      // Add to cart
      if (!isInStock) {
        return res.status(400).json({
          success: false,
          message: "Product is out of stock",
        });
      }

      if (quantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`,
        });
      }

      // Get image from variant
      let productImage = product.imgUrl;
      if (product.variants && product.variants.length > 0) {
        let targetVariant = product.variants[0];
        if (color) {
          const colorVariant = product.variants.find(
            (v) =>
              v.colorName && v.colorName.toLowerCase() === color.toLowerCase()
          );
          if (colorVariant) {
            targetVariant = colorVariant;
          }
        }
        if (targetVariant.images && targetVariant.images.length > 0) {
          productImage = targetVariant.images[0];
        }
      }

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = new Cart({
          user: userId,
          products: [
            {
              product: productId,
              quantity: quantity,
              size: size || null,
              color: color || null,
              title: product.title,
              imgUrl: productImage,
              discountedprice: product.sellingPrice || product.discountedprice,
              ogprice: product.mrp || product.ogprice,
              discount: product.discount || 0,
              category: product.category,
              seller: product.seller,
            },
          ],
        });
      } else {
        const existingProductIndex = cart.products.findIndex(
          (p) =>
            p.product.toString() === productId &&
            p.size === (size || null) &&
            p.color === (color || null)
        );

        if (existingProductIndex >= 0) {
          const newQuantity =
            cart.products[existingProductIndex].quantity + quantity;
          if (newQuantity > availableStock) {
            return res.status(400).json({
              success: false,
              message: `Only ${availableStock} items available. You already have ${cart.products[existingProductIndex].quantity} in cart.`,
            });
          }
          cart.products[existingProductIndex].quantity = newQuantity;
        } else {
          cart.products.push({
            product: productId,
            quantity: quantity,
            size: size || null,
            color: color || null,
            title: product.title,
            imgUrl: productImage,
            discountedprice: product.sellingPrice || product.discountedprice,
            ogprice: product.mrp || product.ogprice,
            discount: product.discount || 0,
            category: product.category,
            seller: product.seller,
          });
        }
      }

      await cart.save();

      const populatedCart = await Cart.findOne({ user: userId }).populate(
        "products.product"
      );

      return res.status(200).json({
        success: true,
        message: "Product added to cart",
        cart: populatedCart,
      });
    }
  } catch (error) {
    console.error("Error in cart operation:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get cart products with detailed information
const GetCartProducts = async (req, res) => {
  try {
    const userId = req.userId;
    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product",
      "title imgUrl discountedprice ogprice discount inStock quantity category size seller"
    );

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { products: [], user: userId },
      });
    }

    const cartSummary = {
      totalItems: cart.products.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cart.products.reduce((sum, item) => {
        const product = item.product;
        return sum + product.discountedprice * item.quantity;
      }, 0),
      originalPrice: cart.products.reduce((sum, item) => {
        const product = item.product;
        return sum + product.ogprice * item.quantity;
      }, 0),
      totalDiscount: cart.products.reduce((sum, item) => {
        const product = item.product;
        return (
          sum + (product.ogprice - product.discountedprice) * item.quantity
        );
      }, 0),
    };

    return res.status(200).json({
      success: true,
      cart,
      summary: cartSummary,
    });
  } catch (error) {
    console.error("Error fetching cart products:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create Orders - WITH MANUAL ORDER ID GENERATION
const CreateOrders = async (req, res) => {
  try {
    const {
      products,
      totalAmount,
      deliveryCharges,
      finalAmount,
      shippingAddress,
      paymentMethod,
      couponCode,
      couponDiscount,
    } = req.body;

    console.log("CreateOrders - Request Body:", req.body);

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products are required. Your cart may be empty.",
      });
    }

    // Validate amounts
    const totalAmountNum = Number(totalAmount);
    const finalAmountNum = Number(finalAmount);
    const deliveryChargesNum = Number(deliveryCharges) || 0;
    const couponDiscountNum = Number(couponDiscount) || 0;

    if (totalAmountNum <= 0 || finalAmountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount values",
      });
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // Fetch product details with proper image handling
    const productDetails = await Promise.all(
      products.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Get the correct image based on color variant
        let productImage = null;

        if (product.variants && product.variants.length > 0) {
          // If color is specified, find that variant's image
          if (item.color) {
            const colorVariant = product.variants.find(
              (v) =>
                v.colorName &&
                v.colorName.toLowerCase() === item.color.toLowerCase()
            );
            if (
              colorVariant &&
              colorVariant.images &&
              colorVariant.images.length > 0
            ) {
              productImage = colorVariant.images[0];
            }
          }

          // Fallback to first variant's image
          if (
            !productImage &&
            product.variants[0].images &&
            product.variants[0].images.length > 0
          ) {
            productImage = product.variants[0].images[0];
          }
        }

        return {
          ...item,
          seller: product.seller,
          title: product.title,
          imgUrl: productImage,
        };
      })
    );

    // Generate order ID
    const generateOrderId = () => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `ORD-${timestamp}-${random}`;
    };

    // Create order
    const order = new Order({
      user: req.userId,
      orderId: generateOrderId(),
      products: productDetails.map((item) => ({
        product: item.productId,
        quantity: Number(item.quantity) || 1,
        price: Number(item.price),
        title: item.title,
        imgUrl: item.imgUrl,
        seller: item.seller,
        size: item.size || null,
        color: item.color || null,
        productStatus: "Pending",
      })),
      totalAmount: totalAmountNum,
      deliveryCharges: deliveryChargesNum,
      finalAmount: finalAmountNum,
      couponCode: couponCode || null,
      couponDiscount: couponDiscountNum,
      shippingAddress: {
        name: shippingAddress.name,
        address: shippingAddress.address || "Address not provided",
        city: shippingAddress.city || "City not provided",
        state: shippingAddress.state || "State not provided",
        pincode: shippingAddress.pincode || "000000",
        phone: shippingAddress.phone,
      },
      paymentMethod: paymentMethod || "COD",
      orderStatus: "Pending",
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
    });

    // Set expected delivery date (7 days from now)
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 7);
    order.expectedDelivery = expectedDelivery;

    await order.save();

    // Update stock for specific size in variant
    await Promise.all(
      productDetails.map(async (item) => {
        const product = await Product.findById(item.productId);

        if (product.variants && product.variants.length > 0) {
          // Find the right variant and update size stock
          const variantIndex = product.variants.findIndex(
            (v) =>
              v.colorName &&
              item.color &&
              v.colorName.toLowerCase() === item.color.toLowerCase()
          );

          if (variantIndex !== -1) {
            const sizeIndex = product.variants[variantIndex].sizes.findIndex(
              (s) => s.size === item.size
            );

            if (sizeIndex !== -1) {
              product.variants[variantIndex].sizes[sizeIndex].stock -= Number(
                item.quantity
              );
              await product.save();
            }
          }
        }
      })
    );

    // Clear user's cart
    try {
      await Cart.findOneAndUpdate(
        { user: req.userId },
        { $set: { products: [] } }
      );
    } catch (cartError) {
      console.error("Error clearing cart:", cartError);
    }

    // Populate the order
    await order.populate("products.product");
    await order.populate("products.seller", "name email brandName mobile");

    console.log("Order created successfully:", order.orderId);

    res.json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating order",
    });
  }
};

const GetAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("products.product")
      .populate("products.seller", "name email brandName mobile")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
};

const GetOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.userId,
    })
      .populate("products.product")
      .populate("products.seller", "name email brandName mobile");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
    });
  }
};

export {
  GetAllProducts,
  AddToCart,
  GetCartProducts,
  CreateOrders,
  GetAllOrders,
  GetOrderById,
};
