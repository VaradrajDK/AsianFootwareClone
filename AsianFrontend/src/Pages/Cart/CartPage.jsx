// pages/Cart/CartPage.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  setCartCount,
  setCartItems,
  decrementCart,
} from "../../Redux/userStore";
import { incrementWishlist } from "../../Redux/userStore";
import api from "../../services/axiosConfig";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";
import styles from "../../Styles/cart/CartPage.module.css";

const CartPage = () => {
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get data from Redux store using correct selectors
  const user = useSelector((state) => state.user.userInfo);
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = useSelector((state) => state.cart.count);

  // Get user ID helper
  const getUserId = () => user?.userId || user?._id || user?.id || null;

  // Fetch cart items on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await api.get("/product/getcarproducts");

        if (response.data.success && response.data.cart) {
          const items = response.data.cart.products || [];
          dispatch(setCartItems(items));
        } else {
          dispatch(setCartItems([]));
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        toast.error("Failed to load cart");
        dispatch(setCartItems([]));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCart();
    } else {
      setLoading(false);
      dispatch(setCartItems([]));
    }
  }, [user, dispatch]);

  // Remove item from cart
  const handleRemoveItem = async (productId, size, color) => {
    if (removing) return;
    setRemoving(productId);

    try {
      const response = await api.post("/product/addToCart", {
        productId,
        size,
        color,
        action: "remove",
      });

      if (response.data.success) {
        // Update Redux store
        const updatedItems = cartItems.filter(
          (item) =>
            !(
              (item.product?._id || item.product) === productId &&
              item.size === size
            )
        );
        dispatch(setCartItems(updatedItems));
        toast.success("Item removed from cart");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setRemoving(null);
    }
  };

  // Update item quantity
  const handleUpdateQuantity = async (productId, size, color, newQuantity) => {
    if (newQuantity < 1 || newQuantity > 10) return;

    try {
      const response = await api.post("/product/addToCart", {
        productId,
        size,
        color,
        quantity: newQuantity,
        action: "update",
      });

      if (response.data.success) {
        // Update Redux store
        const updatedItems = cartItems.map((item) =>
          (item.product?._id || item.product) === productId &&
          item.size === size
            ? { ...item, quantity: newQuantity }
            : item
        );
        dispatch(setCartItems(updatedItems));
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    }
  };

  // Move to wishlist
  const handleMoveToWishlist = async (item) => {
    const productId = item.product?._id || item.product;
    const userId = getUserId();

    if (!userId) {
      toast.info("Please login to add items to wishlist");
      navigate("/login");
      return;
    }

    try {
      // Add to wishlist
      await api.post("/wishlist/addWishlistItem", {
        userId,
        productId,
        color: item.color,
        image: item.imgUrl,
      });

      // Update wishlist count
      dispatch(incrementWishlist());

      // Remove from cart
      await handleRemoveItem(productId, item.size, item.color);
      toast.success("Moved to wishlist");
    } catch (error) {
      console.error("Error moving to wishlist:", error);
      toast.error("Failed to move to wishlist");
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let cartTotal = 0;
    let mrpTotal = 0;

    cartItems.forEach((item) => {
      const price = item.discountedprice || item.product?.sellingPrice || 0;
      const mrp = item.ogprice || item.product?.mrp || price;
      cartTotal += price * item.quantity;
      mrpTotal += mrp * item.quantity;
    });

    const discount = mrpTotal - cartTotal;
    const deliveryCharges = cartTotal >= 999 ? 0 : 49;
    const orderTotal = cartTotal + deliveryCharges;

    return {
      cartTotal,
      mrpTotal,
      discount,
      deliveryCharges,
      orderTotal,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  // Place order
  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className={styles.notLoggedIn}>
        <h2>Please login to view your cart</h2>
        <button onClick={() => navigate("/login")} className={styles.loginBtn}>
          Login
        </button>
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  const totals = calculateTotals();

  return (
    <div className={styles.page}>
      {/* Left: Cart Items */}
      <div className={styles.cartSection}>
        <h2 className={styles.heading}>MY CART ({totals.itemCount})</h2>
        <p className={styles.subText}>
          Proceed to checkout to apply coupons and avail discounts.
        </p>

        <div className={styles.cartItems}>
          {cartItems.map((item, index) => (
            <CartItem
              key={`${item.product?._id || item.product}-${item.size}-${index}`}
              item={item}
              onRemove={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              onMoveToWishlist={handleMoveToWishlist}
              isRemoving={removing === (item.product?._id || item.product)}
            />
          ))}
        </div>
      </div>

      {/* Right: Price Details */}
      <div className={styles.priceSection}>
        <CartSummary
          totals={totals}
          onPlaceOrder={handlePlaceOrder}
          isLoading={placingOrder}
        />
      </div>
    </div>
  );
};

export default CartPage;
