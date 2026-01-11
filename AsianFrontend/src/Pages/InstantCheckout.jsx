// InstantCheckout.jsx - Updated with proper redirect and Redux
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  FiMapPin,
  FiCreditCard,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiShield,
  FiGift,
  FiPercent,
  FiSmartphone,
  FiHome,
  FiBriefcase,
  FiEdit2,
  FiPlus,
  FiTruck,
  FiPackage,
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiX,
} from "react-icons/fi";
import {
  BsBank2,
  BsCreditCard2Back,
  BsWallet2,
  BsQrCode,
  BsShieldCheck,
} from "react-icons/bs";
import { MdPayment, MdLocalOffer, MdVerified } from "react-icons/md";
import { HiOutlineCash, HiOutlineReceiptRefund } from "react-icons/hi";
import { RiCoupon3Line } from "react-icons/ri";
import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import api from "../services/axiosConfig";
import styles from "../Styles/InstantCheckout.module.css";

const InstantCheckout = () => {
  const navigate = useNavigate();

  // Get user from Redux store
  const user = useSelector((state) => state.user.userInfo);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  // Helper function to get user ID
  const getUserId = useCallback(() => {
    return user?.userId || user?._id || user?.id || null;
  }, [user]);

  // State management
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User and Address states
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    mobile: "",
    label: "home",
    isDefault: false,
  });
  const [addressLoading, setAddressLoading] = useState(false);

  // Cart states
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    totalPrice: 0,
    originalPrice: 0,
    totalDiscount: 0,
  });

  // Payment states
  const [showSummary, setShowSummary] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const upiApps = [
    { id: "gpay", name: "Google Pay", icon: SiGooglepay },
    { id: "phonepe", name: "PhonePe", icon: SiPhonepe },
    { id: "paytm", name: "Paytm", icon: SiPaytm },
  ];

  // Check authentication and redirect if not logged in
  useEffect(() => {
    const userId = getUserId();

    if (!userId && !isAuthenticated) {
      toast.error("Please login to continue checkout");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (userId) {
      loadData(userId);
    }
  }, [user, isAuthenticated, getUserId, navigate]);

  const loadData = async (userId) => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchUserData(userId), fetchCartData()]);
    } catch (err) {
      console.error("Error loading checkout data:", err);
      setError("Failed to load checkout data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data and addresses
  const fetchUserData = async (userId) => {
    try {
      const response = await api.get(`/user/profile/${userId}`);

      if (response.data.success) {
        setUserProfile(response.data.user);
        setAddresses(response.data.user.addresses || []);

        const defaultAddr = response.data.user.addresses?.find(
          (addr) => addr.isDefault
        );
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        } else if (response.data.user.addresses?.length > 0) {
          setSelectedAddress(response.data.user.addresses[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      throw err;
    }
  };

  // Fetch cart data
  const fetchCartData = async () => {
    try {
      const response = await api.get("/product/getcarproducts");

      if (response.data.success) {
        const products = response.data.cart?.products || [];
        setCartItems(products);

        if (response.data.summary && response.data.summary.totalPrice > 0) {
          setCartSummary({
            totalItems: Number(response.data.summary.totalItems) || 0,
            totalPrice: Number(response.data.summary.totalPrice) || 0,
            originalPrice: Number(response.data.summary.originalPrice) || 0,
            totalDiscount: Number(response.data.summary.totalDiscount) || 0,
          });
        } else {
          let totalItems = 0;
          let totalPrice = 0;
          let originalPrice = 0;

          products.forEach((item) => {
            const qty = Number(item.quantity) || 1;
            const discountedPrice =
              Number(item.discountedprice) ||
              Number(item.product?.discountedprice) ||
              Number(item.product?.sellingPrice) ||
              0;
            const ogPrice =
              Number(item.ogprice) ||
              Number(item.product?.ogprice) ||
              Number(item.product?.mrp) ||
              discountedPrice;

            totalItems += qty;
            totalPrice += discountedPrice * qty;
            originalPrice += ogPrice * qty;
          });

          setCartSummary({
            totalItems,
            totalPrice,
            originalPrice,
            totalDiscount: originalPrice - totalPrice,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      throw err;
    }
  };

  // Validation functions
  const validateUpiId = useCallback((upi) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upi) return "Please enter your UPI ID";
    if (!upiRegex.test(upi)) return "Enter valid UPI ID (e.g., name@upi)";
    return "";
  }, []);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Address handlers
  const handleAddressSelect = useCallback((addr) => {
    setSelectedAddress(addr);
    setTimeout(() => {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);
  }, []);

  const handleChangeAddress = useCallback(() => {
    setStep(1);
  }, []);

  const handleAddressFormChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error("Please login to add address");
      return;
    }

    try {
      setAddressLoading(true);
      const response = await api.post(`/user/address/${userId}`, addressForm);

      if (response.data.success) {
        setAddresses(response.data.addresses);
        setShowAddressModal(false);
        resetAddressForm();
        toast.success("Address added successfully");

        if (response.data.addresses.length === 1 || addressForm.isDefault) {
          const newDefault = response.data.addresses.find(
            (addr) => addr.isDefault
          );
          if (newDefault) setSelectedAddress(newDefault);
        }
      }
    } catch (err) {
      console.error("Error adding address:", err);
      toast.error(err.response?.data?.message || "Failed to add address");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error("Please login to update address");
      return;
    }

    try {
      setAddressLoading(true);
      const response = await api.put(
        `/user/address/${userId}/${editingAddress._id}`,
        addressForm
      );

      if (response.data.success) {
        setAddresses(response.data.addresses);
        setShowAddressModal(false);
        setEditingAddress(null);
        resetAddressForm();
        toast.success("Address updated successfully");

        if (selectedAddress?._id === editingAddress._id) {
          const updated = response.data.addresses.find(
            (addr) => addr._id === editingAddress._id
          );
          if (updated) setSelectedAddress(updated);
        }
      }
    } catch (err) {
      console.error("Error updating address:", err);
      toast.error(err.response?.data?.message || "Failed to update address");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await api.delete(`/user/address/${userId}/${addressId}`);

      if (response.data.success) {
        setAddresses(response.data.addresses);
        toast.success("Address deleted successfully");

        if (selectedAddress?._id === addressId) {
          const newDefault = response.data.addresses.find(
            (addr) => addr.isDefault
          );
          setSelectedAddress(newDefault || response.data.addresses[0] || null);
        }
      }
    } catch (err) {
      console.error("Error deleting address:", err);
      toast.error(err.response?.data?.message || "Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const response = await api.patch(
        `/user/address/${userId}/${addressId}/default`
      );

      if (response.data.success) {
        setAddresses(response.data.addresses);
        toast.success("Default address updated");
      }
    } catch (err) {
      console.error("Error setting default address:", err);
    }
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      mobile: addr.mobile || "",
      label: addr.label || "home",
      isDefault: addr.isDefault || false,
    });
    setShowAddressModal(true);
  };

  const openAddModal = () => {
    setEditingAddress(null);
    resetAddressForm();
    setShowAddressModal(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      address: "",
      city: "",
      state: "",
      pincode: "",
      mobile: "",
      label: "home",
      isDefault: false,
    });
  };

  // Payment handlers
  const handleUpiChange = useCallback(
    (e) => {
      const value = e.target.value;
      setUpiId(value);
      if (upiError) {
        setUpiError(validateUpiId(value));
      }
    },
    [upiError, validateUpiId]
  );

  const handleCardChange = (field, value) => {
    let formattedValue = value;
    if (field === "number") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cvv") {
      formattedValue = value.replace(/[^0-9]/g, "").substring(0, 4);
    }
    setCardDetails((prev) => ({ ...prev, [field]: formattedValue }));
  };

  // Calculate final amounts
  const calculateTotals = useCallback(() => {
    const subtotal = Number(cartSummary.totalPrice) || 0;
    const originalPrice = Number(cartSummary.originalPrice) || 0;
    const totalDiscount = Number(cartSummary.totalDiscount) || 0;
    const couponDiscount = Number(appliedCoupon?.discount) || 0;
    const deliveryCharges = subtotal > 499 ? 0 : 40;
    const codCharges = selectedPayment === "cod" ? 40 : 0;
    const finalAmount =
      subtotal - couponDiscount + deliveryCharges + codCharges;
    const totalSavings = totalDiscount + couponDiscount;

    return {
      subtotal: subtotal > 0 ? subtotal : 0,
      originalPrice: originalPrice > 0 ? originalPrice : 0,
      couponDiscount: couponDiscount > 0 ? couponDiscount : 0,
      deliveryCharges,
      codCharges,
      finalAmount: finalAmount > 0 ? finalAmount : 0,
      totalSavings: totalSavings > 0 ? totalSavings : 0,
    };
  }, [cartSummary, appliedCoupon, selectedPayment]);

  // Handle Payment Submit - UPDATED with proper redirect
  const handlePaymentSubmit = useCallback(async () => {
    const userId = getUserId();

    if (!userId) {
      toast.error("Please login to continue");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      setStep(1);
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    // Validate UPI if selected
    if (selectedPayment === "upi" && !selectedUpiApp) {
      const error = validateUpiId(upiId);
      if (error) {
        setUpiError(error);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const totals = calculateTotals();

      if (!totals.subtotal || totals.subtotal <= 0) {
        throw new Error("Invalid cart total. Please refresh and try again.");
      }

      if (!totals.finalAmount || totals.finalAmount <= 0) {
        throw new Error("Invalid order amount. Please refresh and try again.");
      }

      const products = cartItems.map((item) => {
        const productId = item.product?._id || item.product;
        const price =
          Number(item.discountedprice) ||
          Number(item.product?.discountedprice) ||
          Number(item.product?.sellingPrice) ||
          0;
        const quantity = Number(item.quantity) || 1;

        if (!productId) {
          throw new Error("Invalid product in cart");
        }

        if (price <= 0) {
          throw new Error(
            `Invalid price for product: ${item.title || item.product?.title}`
          );
        }

        return {
          productId,
          quantity,
          price,
          size: item.size || null,
          color: item.color || null,
        };
      });

      if (!selectedAddress.address || !selectedAddress.mobile) {
        throw new Error("Invalid shipping address");
      }

      const orderData = {
        products,
        totalAmount: Number(totals.subtotal.toFixed(2)),
        deliveryCharges: Number(totals.deliveryCharges),
        finalAmount: Number(totals.finalAmount.toFixed(2)),
        shippingAddress: {
          name: userProfile?.name || user?.name || "Customer",
          address: selectedAddress.address,
          city: selectedAddress.city || "Not specified",
          state: selectedAddress.state || "Not specified",
          pincode: selectedAddress.pincode || "000000",
          phone: selectedAddress.mobile,
        },
        paymentMethod: selectedPayment.toUpperCase(),
        couponCode: appliedCoupon?.code || null,
        couponDiscount: Number(totals.couponDiscount) || 0,
      };

      console.log("Order Data being sent:", orderData);

      const response = await api.post("/product/createOrders", orderData);

      if (response.data.success) {
        // Show success toast
        toast.success("🎉 Order placed successfully!");

        // Navigate to orders page with success state
        navigate("/orders", {
          state: {
            orderSuccess: true,
            orderId: response.data.order.orderId,
            order: response.data.order,
          },
        });
      } else {
        throw new Error(response.data.message || "Order creation failed");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    getUserId,
    selectedAddress,
    cartItems,
    selectedPayment,
    selectedUpiApp,
    upiId,
    validateUpiId,
    userProfile,
    user,
    appliedCoupon,
    calculateTotals,
    navigate,
  ]);

  const handleVoucherRedeem = useCallback(async () => {
    if (!voucherCode.trim()) {
      toast.warning("Please enter a voucher code");
      return;
    }

    try {
      if (voucherCode.toUpperCase() === "SAVE10") {
        setAppliedCoupon({
          code: "SAVE10",
          discount: cartSummary.totalPrice * 0.1,
          description: "10% off on your order",
        });
        toast.success("Coupon applied successfully!");
      } else if (voucherCode.toUpperCase() === "FLAT50") {
        setAppliedCoupon({
          code: "FLAT50",
          discount: 50,
          description: "Flat ₹50 off",
        });
        toast.success("Coupon applied successfully!");
      } else {
        toast.error("Invalid coupon code");
      }
    } catch (err) {
      toast.error("Failed to apply coupon");
    }
  }, [voucherCode, cartSummary.totalPrice]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setVoucherCode("");
    toast.info("Coupon removed");
  };

  const getAddressIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "home":
        return <FiHome />;
      case "work":
        return <FiBriefcase />;
      default:
        return <FiMapPin />;
    }
  };

  const getDisplayName = () => {
    return userProfile?.name || user?.name || user?.email || "Customer";
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  // Not logged in state
  if (!getUserId()) {
    return (
      <div className={styles.errorWrapper}>
        <FiLock size={48} />
        <h3>Login Required</h3>
        <p>Please login to continue with checkout</p>
        <button
          onClick={() => navigate("/login", { state: { from: "/checkout" } })}
        >
          Login Now
        </button>
      </div>
    );
  }

  // Error state
  if (error && !cartItems.length) {
    return (
      <div className={styles.errorWrapper}>
        <FiAlertCircle size={48} />
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <FiPackage size={48} />
        <h3>Your cart is empty</h3>
        <p>Add some products to continue checkout</p>
        <button onClick={() => navigate("/products")}>Continue Shopping</button>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className={styles.wrapper}>
      {/* Stepper */}
      <nav className={styles.stepper}>
        <div className={styles.stepLine}>
          <div
            className={styles.stepProgress}
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        <div className={styles.step}>
          <div className={styles.stepDone}>
            <FiCheck size={14} />
          </div>
          <span>Login</span>
        </div>

        <div className={styles.step}>
          <div
            className={
              step >= 1
                ? step === 1
                  ? styles.stepActive
                  : styles.stepDone
                : styles.stepDefault
            }
          >
            {step > 1 ? <FiCheck size={14} /> : <FiMapPin size={14} />}
          </div>
          <span>Address</span>
        </div>

        <div className={styles.step}>
          <div className={step === 2 ? styles.stepActive : styles.stepDefault}>
            <FiCreditCard size={14} />
          </div>
          <span>Payment</span>
        </div>
      </nav>

      <main className={styles.layout}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Step 1: Address */}
          {step === 1 && (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2>
                  <FiMapPin size={16} /> Select Delivery Address
                </h2>
                <button className={styles.addBtn} onClick={openAddModal}>
                  <FiPlus size={14} /> Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className={styles.noAddress}>
                  <FiMapPin size={32} />
                  <p>No addresses found</p>
                  <button onClick={openAddModal}>Add Your First Address</button>
                </div>
              ) : (
                <div className={styles.addressList}>
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`${styles.addressItem} ${
                        selectedAddress?._id === addr._id ? styles.selected : ""
                      }`}
                      onClick={() => handleAddressSelect(addr)}
                    >
                      <div className={styles.addressTop}>
                        <div className={styles.addressType}>
                          <span className={styles.typeIcon}>
                            {getAddressIcon(addr.label)}
                          </span>
                          <span>{addr.label || "Address"}</span>
                          {addr.isDefault && (
                            <span className={styles.defaultTag}>Default</span>
                          )}
                        </div>
                        <div
                          className={`${styles.radio} ${
                            selectedAddress?._id === addr._id
                              ? styles.radioOn
                              : ""
                          }`}
                        >
                          {selectedAddress?._id === addr._id && (
                            <FiCheck size={10} />
                          )}
                        </div>
                      </div>

                      <div className={styles.addressBody}>
                        <p className={styles.name}>{getDisplayName()}</p>
                        <p className={styles.addr}>{addr.address}</p>
                        <p className={styles.addr}>
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className={styles.phone}>
                          <FiSmartphone size={12} /> {addr.mobile}
                        </p>
                      </div>

                      <div className={styles.addressActions}>
                        <button
                          className={styles.editBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(addr);
                          }}
                        >
                          <FiEdit2 size={12} /> Edit
                        </button>
                        {!addr.isDefault && (
                          <button
                            className={styles.setDefaultBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefaultAddress(addr._id);
                            }}
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(addr._id);
                          }}
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <>
              {/* Shipping Card */}
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h2>
                    <FiTruck size={16} /> Shipping Details
                  </h2>
                  <button
                    className={styles.changeBtn}
                    onClick={handleChangeAddress}
                  >
                    <FiEdit2 size={12} /> Change
                  </button>
                </div>

                <div className={styles.shipInfo}>
                  <div className={styles.shipAddr}>
                    <div className={styles.addressType}>
                      <span className={styles.typeIcon}>
                        {getAddressIcon(selectedAddress?.label)}
                      </span>
                      <span>{selectedAddress?.label || "Address"}</span>
                    </div>
                    <p className={styles.name}>{getDisplayName()}</p>
                    <p className={styles.addr}>{selectedAddress?.address}</p>
                    <p className={styles.addr}>
                      {selectedAddress?.city}, {selectedAddress?.state} -{" "}
                      {selectedAddress?.pincode}
                    </p>
                    <p className={styles.phone}>
                      <FiSmartphone size={12} /> {selectedAddress?.mobile}
                    </p>
                  </div>

                  <div className={styles.deliveryBox}>
                    <FiTruck size={18} />
                    <div>
                      <span className={styles.delLabel}>
                        Estimated Delivery
                      </span>
                      <span className={styles.delDate}>
                        {new Date(
                          Date.now() + 5 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString("en-IN", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Card */}
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <h2>
                    <MdPayment size={16} /> Payment Method
                  </h2>
                  <span className={styles.secureBadge}>
                    <FiShield size={12} /> Secure
                  </span>
                </div>

                <div className={styles.paymentBox}>
                  {/* COD - Default Selected */}
                  <div
                    className={`${styles.payOption} ${
                      selectedPayment === "cod" ? styles.payOpen : ""
                    }`}
                  >
                    <div
                      className={styles.payHead}
                      onClick={() => setSelectedPayment("cod")}
                    >
                      <div className={styles.payLeft}>
                        <div
                          className={`${styles.radio} ${
                            selectedPayment === "cod" ? styles.radioOn : ""
                          }`}
                        >
                          {selectedPayment === "cod" && <FiCheck size={10} />}
                        </div>
                        <HiOutlineCash size={18} />
                        <div>
                          <span className={styles.payName}>
                            Cash on Delivery
                          </span>
                          <span className={styles.payDesc}>
                            Pay when you receive
                          </span>
                        </div>
                      </div>
                      <div className={styles.payRight}>
                        <span className={styles.recBadge}>Recommended</span>
                        <span className={styles.codFee}>+₹40</span>
                        {selectedPayment === "cod" ? (
                          <FiChevronUp size={16} />
                        ) : (
                          <FiChevronDown size={16} />
                        )}
                      </div>
                    </div>

                    {selectedPayment === "cod" && (
                      <div className={styles.payContent}>
                        <div className={styles.codNote}>
                          <FiAlertCircle size={14} />
                          <p>
                            Additional ₹40 will be charged for Cash on Delivery.
                          </p>
                        </div>
                        <button
                          className={styles.payBtn}
                          onClick={handlePaymentSubmit}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <span className={styles.spin}></span>{" "}
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiCheck size={14} /> Place Order - ₹
                              {totals.finalAmount.toFixed(2)}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UPI Option */}
                  <div
                    className={`${styles.payOption} ${
                      selectedPayment === "upi" ? styles.payOpen : ""
                    }`}
                  >
                    <div
                      className={styles.payHead}
                      onClick={() => setSelectedPayment("upi")}
                    >
                      <div className={styles.payLeft}>
                        <div
                          className={`${styles.radio} ${
                            selectedPayment === "upi" ? styles.radioOn : ""
                          }`}
                        >
                          {selectedPayment === "upi" && <FiCheck size={10} />}
                        </div>
                        <BsQrCode size={18} />
                        <div>
                          <span className={styles.payName}>UPI</span>
                          <span className={styles.payDesc}>
                            Pay with any UPI app
                          </span>
                        </div>
                      </div>
                      <div className={styles.payRight}>
                        {selectedPayment === "upi" ? (
                          <FiChevronUp size={16} />
                        ) : (
                          <FiChevronDown size={16} />
                        )}
                      </div>
                    </div>

                    {selectedPayment === "upi" && (
                      <div className={styles.payContent}>
                        <div className={styles.amountBar}>
                          <FiLock size={14} />
                          Pay ₹{totals.finalAmount.toFixed(2)}
                        </div>

                        <div className={styles.upiApps}>
                          <p>Select UPI App</p>
                          <div className={styles.appGrid}>
                            {upiApps.map((app) => (
                              <button
                                key={app.id}
                                className={`${styles.appBtn} ${
                                  selectedUpiApp === app.id
                                    ? styles.appSelected
                                    : ""
                                }`}
                                onClick={() => setSelectedUpiApp(app.id)}
                              >
                                <app.icon size={20} />
                                <span>{app.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.divider}>
                          <span>OR</span>
                        </div>

                        <div className={styles.upiInput}>
                          <label>Enter UPI ID</label>
                          <div className={styles.inputRow}>
                            <input
                              type="text"
                              placeholder="username@upi"
                              value={upiId}
                              onChange={handleUpiChange}
                              className={upiError ? styles.inputErr : ""}
                            />
                            <button>Verify</button>
                          </div>
                          {upiError && (
                            <span className={styles.errText}>
                              <FiAlertCircle size={10} /> {upiError}
                            </span>
                          )}
                        </div>

                        <button
                          className={styles.payBtn}
                          onClick={handlePaymentSubmit}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <span className={styles.spin}></span>{" "}
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiLock size={14} /> Pay ₹
                              {totals.finalAmount.toFixed(2)}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Payment */}
                  <div
                    className={`${styles.payOption} ${
                      selectedPayment === "card" ? styles.payOpen : ""
                    }`}
                  >
                    <div
                      className={styles.payHead}
                      onClick={() => setSelectedPayment("card")}
                    >
                      <div className={styles.payLeft}>
                        <div
                          className={`${styles.radio} ${
                            selectedPayment === "card" ? styles.radioOn : ""
                          }`}
                        >
                          {selectedPayment === "card" && <FiCheck size={10} />}
                        </div>
                        <BsCreditCard2Back size={18} />
                        <div>
                          <span className={styles.payName}>
                            Credit / Debit Card
                          </span>
                          <span className={styles.payDesc}>
                            Visa, Mastercard, RuPay
                          </span>
                        </div>
                      </div>
                      <div className={styles.payRight}>
                        {selectedPayment === "card" ? (
                          <FiChevronUp size={16} />
                        ) : (
                          <FiChevronDown size={16} />
                        )}
                      </div>
                    </div>

                    {selectedPayment === "card" && (
                      <div className={styles.payContent}>
                        <div className={styles.cardForm}>
                          <div className={styles.formGroup}>
                            <label>Card Number</label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={cardDetails.number}
                              onChange={(e) =>
                                handleCardChange("number", e.target.value)
                              }
                              maxLength={19}
                            />
                          </div>
                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label>Expiry</label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardDetails.expiry}
                                onChange={(e) =>
                                  handleCardChange("expiry", e.target.value)
                                }
                                maxLength={5}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>CVV</label>
                              <input
                                type="password"
                                placeholder="•••"
                                value={cardDetails.cvv}
                                onChange={(e) =>
                                  handleCardChange("cvv", e.target.value)
                                }
                                maxLength={4}
                              />
                            </div>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Name on Card</label>
                            <input
                              type="text"
                              placeholder="John Doe"
                              value={cardDetails.name}
                              onChange={(e) =>
                                handleCardChange("name", e.target.value)
                              }
                            />
                          </div>
                          <button
                            className={styles.payBtn}
                            onClick={handlePaymentSubmit}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <span className={styles.spin}></span>{" "}
                                Processing...
                              </>
                            ) : (
                              <>
                                <FiLock size={14} /> Pay ₹
                                {totals.finalAmount.toFixed(2)}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Net Banking */}
                  <div
                    className={`${styles.payOption} ${
                      selectedPayment === "netbanking" ? styles.payOpen : ""
                    }`}
                  >
                    <div
                      className={styles.payHead}
                      onClick={() => setSelectedPayment("netbanking")}
                    >
                      <div className={styles.payLeft}>
                        <div
                          className={`${styles.radio} ${
                            selectedPayment === "netbanking"
                              ? styles.radioOn
                              : ""
                          }`}
                        >
                          {selectedPayment === "netbanking" && (
                            <FiCheck size={10} />
                          )}
                        </div>
                        <BsBank2 size={18} />
                        <div>
                          <span className={styles.payName}>Net Banking</span>
                          <span className={styles.payDesc}>
                            All major banks
                          </span>
                        </div>
                      </div>
                      <div className={styles.payRight}>
                        {selectedPayment === "netbanking" ? (
                          <FiChevronUp size={16} />
                        ) : (
                          <FiChevronDown size={16} />
                        )}
                      </div>
                    </div>

                    {selectedPayment === "netbanking" && (
                      <div className={styles.payContent}>
                        <div className={styles.bankGrid}>
                          {[
                            "HDFC",
                            "ICICI",
                            "SBI",
                            "Axis",
                            "Kotak",
                            "Other",
                          ].map((bank) => (
                            <button key={bank} className={styles.bankBtn}>
                              <BsBank2 size={16} />
                              <span>{bank}</span>
                            </button>
                          ))}
                        </div>
                        <button
                          className={styles.payBtn}
                          onClick={handlePaymentSubmit}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <span className={styles.spin}></span>{" "}
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiLock size={14} /> Pay ₹
                              {totals.finalAmount.toFixed(2)}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Wallet */}
                  <div className={styles.payOption}>
                    <div
                      className={styles.payHead}
                      onClick={() => setSelectedPayment("wallet")}
                    >
                      <div className={styles.payLeft}>
                        <div
                          className={`${styles.radio} ${
                            selectedPayment === "wallet" ? styles.radioOn : ""
                          }`}
                        >
                          {selectedPayment === "wallet" && (
                            <FiCheck size={10} />
                          )}
                        </div>
                        <BsWallet2 size={18} />
                        <div>
                          <span className={styles.payName}>Wallets</span>
                          <span className={styles.payDesc}>
                            Paytm, PhonePe, Amazon
                          </span>
                        </div>
                      </div>
                      <FiChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <aside className={styles.rightCol}>
          <div className={styles.sideCard}>
            <div
              className={styles.sideHead}
              onClick={() => setShowSummary(!showSummary)}
            >
              <h3>
                <FiPackage size={14} /> Order Summary ({cartItems.length} items)
              </h3>
              <div className={styles.sideRight}>
                <span className={styles.total}>
                  ₹{totals.finalAmount.toFixed(2)}
                </span>
                {showSummary ? (
                  <FiChevronUp size={14} />
                ) : (
                  <FiChevronDown size={14} />
                )}
              </div>
            </div>

            {showSummary && (
              <div className={styles.sideBody}>
                {cartItems.map((item) => {
                  const product = item.product || {};
                  return (
                    <div key={item._id} className={styles.productRow}>
                      <div className={styles.productImg}>
                        <img
                          src={item.imgUrl || product.imgUrl}
                          alt={item.title || product.title}
                        />
                        <span className={styles.qty}>{item.quantity}</span>
                      </div>
                      <div className={styles.productInfo}>
                        <h4>{item.title || product.title}</h4>
                        <p>
                          {item.size && `Size: ${item.size}`}
                          {item.size && item.color && " | "}
                          {item.color && `Color: ${item.color}`}
                        </p>
                        <div className={styles.priceRow}>
                          <span className={styles.price}>
                            ₹
                            {(
                              item.discountedprice || product.discountedprice
                            )?.toFixed(2)}
                          </span>
                          <span className={styles.oldPrice}>
                            ₹{(item.ogprice || product.ogprice)?.toFixed(2)}
                          </span>
                          {(item.discount || product.discount) > 0 && (
                            <span className={styles.off}>
                              {item.discount || product.discount}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className={styles.priceDetails}>
                  <div className={styles.priceItem}>
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className={styles.priceItem}>
                      <span>
                        Coupon ({appliedCoupon.code})
                        <button
                          className={styles.removeCoupon}
                          onClick={removeCoupon}
                        >
                          <FiX size={10} />
                        </button>
                      </span>
                      <span className={styles.discount}>
                        -₹{totals.couponDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className={styles.priceItem}>
                    <span>Delivery</span>
                    <span
                      className={
                        totals.deliveryCharges === 0 ? styles.free : ""
                      }
                    >
                      {totals.deliveryCharges === 0
                        ? "FREE"
                        : `₹${totals.deliveryCharges}`}
                    </span>
                  </div>
                  {selectedPayment === "cod" && (
                    <div className={styles.priceItem}>
                      <span>COD Charges</span>
                      <span>₹{totals.codCharges}</span>
                    </div>
                  )}
                  <div className={styles.totalRow}>
                    <span>Total</span>
                    <span>₹{totals.finalAmount.toFixed(2)}</span>
                  </div>
                  {totals.totalSavings > 0 && (
                    <div className={styles.savings}>
                      <FiCheckCircle size={12} />
                      You save ₹{totals.totalSavings.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Coupon Section - Step 2 */}
          {step === 2 && (
            <>
              <div className={styles.sideCard}>
                <h3>
                  <RiCoupon3Line size={14} /> Coupons & Offers
                </h3>

                {appliedCoupon ? (
                  <div className={styles.appliedCoupon}>
                    <div className={styles.couponLeft}>
                      <MdLocalOffer size={14} />
                      <div>
                        <span className={styles.couponCode}>
                          {appliedCoupon.code}
                        </span>
                        <span className={styles.couponSave}>
                          -₹{appliedCoupon.discount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button className={styles.removeBtn} onClick={removeCoupon}>
                      <FiX size={12} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.voucherInput}>
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                    />
                    <button onClick={handleVoucherRedeem}>Apply</button>
                  </div>
                )}

                <button className={styles.viewCoupons}>
                  <FiPercent size={12} /> View All Coupons
                </button>
              </div>

              <div className={styles.sideCard}>
                <h3>
                  <FiGift size={14} /> Gift Voucher
                </h3>
                <div className={styles.voucherInput}>
                  <input type="text" placeholder="Enter gift voucher code" />
                  <button>Apply</button>
                </div>
              </div>

              <div className={styles.trustRow}>
                <div className={styles.trustItem}>
                  <BsShieldCheck size={16} />
                  <span>Secure</span>
                </div>
                <div className={styles.trustItem}>
                  <HiOutlineReceiptRefund size={16} />
                  <span>Easy Returns</span>
                </div>
                <div className={styles.trustItem}>
                  <MdVerified size={16} />
                  <span>Genuine</span>
                </div>
              </div>
            </>
          )}
        </aside>
      </main>

      {/* Address Modal */}
      {showAddressModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowAddressModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingAddress ? "Edit Address" : "Add New Address"}</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowAddressModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Address Type</label>
                <div className={styles.labelBtns}>
                  {["home", "work", "other"].map((type) => (
                    <button
                      key={type}
                      className={`${styles.labelBtn} ${
                        addressForm.label === type ? styles.labelActive : ""
                      }`}
                      onClick={() => handleAddressFormChange("label", type)}
                    >
                      {type === "home" && <FiHome size={14} />}
                      {type === "work" && <FiBriefcase size={14} />}
                      {type === "other" && <FiMapPin size={14} />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Full Address *</label>
                <textarea
                  placeholder="House no., Building, Street, Area"
                  value={addressForm.address}
                  onChange={(e) =>
                    handleAddressFormChange("address", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) =>
                      handleAddressFormChange("city", e.target.value)
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>State *</label>
                  <input
                    type="text"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) =>
                      handleAddressFormChange("state", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Pincode *</label>
                  <input
                    type="text"
                    placeholder="6-digit pincode"
                    value={addressForm.pincode}
                    onChange={(e) =>
                      handleAddressFormChange(
                        "pincode",
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      )
                    }
                    maxLength={6}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mobile *</label>
                  <input
                    type="text"
                    placeholder="10-digit mobile"
                    value={addressForm.mobile}
                    onChange={(e) =>
                      handleAddressFormChange(
                        "mobile",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    maxLength={10}
                  />
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) =>
                      handleAddressFormChange("isDefault", e.target.checked)
                    }
                  />
                  Set as default address
                </label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={
                  editingAddress ? handleUpdateAddress : handleAddAddress
                }
                disabled={
                  addressLoading ||
                  !addressForm.address ||
                  !addressForm.city ||
                  !addressForm.state ||
                  !addressForm.pincode ||
                  !addressForm.mobile ||
                  addressForm.pincode.length !== 6 ||
                  addressForm.mobile.length !== 10
                }
              >
                {addressLoading ? (
                  <>
                    <span className={styles.spin}></span> Saving...
                  </>
                ) : (
                  <>{editingAddress ? "Update" : "Save"} Address</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstantCheckout;
