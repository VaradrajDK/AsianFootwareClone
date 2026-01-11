import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faShoppingBag,
  faSearch,
  faChevronDown,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setCartItems, setWishlistCount } from "../../Redux/userStore";
import api from "../../services/axiosConfig";
import styles from "../../Styles/Navbar.module.css";
import logo from "../../assets/logo.webp";

function Navbar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const user = useSelector((state) => state.user.userInfo);
  const wishlistCount = useSelector((state) => state.wishlist?.count || 0);
  const cartCount = useSelector((state) => state.cart?.count || 0);

  const isWishlistFilled = wishlistCount > 0;

  // Helper to get user ID
  const getUserId = () => user?.userId || user?._id || user?.id || null;

  // Fetch cart and wishlist counts on mount and when user changes
  useEffect(() => {
    const fetchCounts = async () => {
      const userId = getUserId();
      if (!userId) return;

      try {
        // Fetch cart items
        const cartRes = await api.get("/product/getcarproducts");
        if (cartRes.data.success && cartRes.data.cart) {
          dispatch(setCartItems(cartRes.data.cart.products || []));
        }

        // Fetch wishlist count
        const wishlistRes = await api.get("/wishlist", {
          params: { userId },
        });
        if (wishlistRes.data.items) {
          dispatch(setWishlistCount(wishlistRes.data.items.length));
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    if (user) {
      fetchCounts();
    }
  }, [user, dispatch]);

  const megaMenuData = {
    Mens: {
      sections: [
        {
          title: "SHOES",
          items: [
            {
              name: "casual shoes",
              path: "/products?gender=Mens&type=Casual Shoes&sort=relevance",
            },
            {
              name: "sports shoes",
              path: "/products?gender=Mens&type=Sports Shoes&sort=relevance",
            },
            {
              name: "sneakers",
              path: "/products?gender=Mens&type=Sneakers&sort=relevance",
            },
          ],
        },
        {
          title: "SANDALS & FLOATERS",
          items: [
            {
              name: "slippers",
              path: "/products?gender=Mens&type=Slippers&sort=relevance",
            },
            {
              name: "sports sandals",
              path: "/products?gender=Mens&type=Sports Sandals&sort=relevance",
            },
          ],
        },
        {
          title: "FEATURED COLLECTIONS",
          items: [
            {
              name: "limited edition sneakers",
              path: "/products?gender=Mens&type=Limited Edition Sneakers&sort=relevance",
            },
          ],
          highlight: true,
        },
      ],
    },
    Women: {
      sections: [
        {
          title: "SHOES",
          items: [
            {
              name: "casual shoes",
              path: "/products?gender=Womens&type=Casual Shoes&sort=relevance",
            },
            {
              name: "sports shoes",
              path: "/products?gender=Womens&type=Sports Shoes&sort=relevance",
            },
            {
              name: "sneakers",
              path: "/products?gender=Womens&type=Sneakers&sort=relevance",
            },
          ],
        },
        {
          title: "SANDALS & FLOATERS",
          items: [
            {
              name: "slippers",
              path: "/products?gender=Womens&type=Slippers&sort=relevance",
            },
          ],
        },
      ],
    },
    Kids: {
      sections: [
        {
          title: "SHOES",
          items: [
            {
              name: "school shoes",
              path: "/products?gender=Kids&type=School Shoes&sort=relevance",
            },
            {
              name: "kids shoes",
              path: "/products?gender=Kids&type=Kids Shoes&sort=relevance",
            },
          ],
        },
      ],
    },
    Accessories: {
      sections: [
        {
          title: "Footwear Care",
          items: [
            {
              name: "shoe shampoo",
              path: "/products?category=Accessories&type=Shoe Shampoo&sort=relevance",
            },
          ],
        },
        {
          title: "Lifestyle Essentials",
          items: [
            {
              name: "shaker bottles",
              path: "/products?category=Accessories&type=Shaker Bottles&sort=relevance",
            },
            {
              name: "socks",
              path: "/products?category=Accessories&type=Socks&sort=relevance",
            },
            {
              name: "caps",
              path: "/products?category=Accessories&type=Caps&sort=relevance",
            },
          ],
        },
        {
          title: "Fashion Accessories",
          items: [
            {
              name: "belts",
              path: "/products?category=Accessories&type=Belts&sort=relevance",
            },
            {
              name: "wallets",
              path: "/products?category=Accessories&type=Wallets&sort=relevance",
            },
            {
              name: "perfumes",
              path: "/products?category=Accessories&type=Perfumes&sort=relevance",
            },
            {
              name: "bags",
              path: "/products?category=Accessories&type=Bags&sort=relevance",
            },
          ],
        },
      ],
    },
  };

  const otherMenuItems = [
    { text: "Collections", path: "/collections" },
    { text: "Apparels", path: "/apparels" },
    { text: "Institutional", path: "/institutional" },
    {
      text: "New Launches",
      color: "#15803d",
      path: "/products?sort=newArrivals",
    },
    {
      text: "Sale",
      color: "#dc2626",
      path: "/products?priceRange=under1000&sort=lowToHigh",
    },
  ];

  const handleMenuMouseEnter = (item) => {
    if (window.innerWidth > 768) {
      setActiveMenu(item);
    }
  };

  const handleMobileMenuClick = (item) => {
    setActiveMenu(activeMenu === item ? null : item);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSubItemClick = (path) => {
    navigate(path);
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  };

  const handleMainMenuItemClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleWishlistClick = () => {
    navigate("/wishlist");
  };

  const handleCartClick = () => {
    navigate("/cart");
  };

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.logoSection}>
            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
            <div className={styles.logo} onClick={() => navigate("/")}>
              <img src={logo} alt="logo" />
            </div>
          </div>

          <div className={styles.menuSection}>
            <ul className={styles.menu}>
              {Object.keys(megaMenuData).map((item, index) => (
                <li
                  key={index}
                  className={styles.menuItem}
                  onMouseEnter={() => handleMenuMouseEnter(item)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <span className={styles.menuItemWithIcon}>{item}</span>

                  {activeMenu === item && (
                    <div className={styles.megaDropdown}>
                      <div className={styles.megaDropdownContainer}>
                        {megaMenuData[item].sections.map(
                          (section, sectionIndex) => (
                            <div
                              key={sectionIndex}
                              className={styles.megaDropdownColumn}
                            >
                              <h4
                                className={`${styles.megaColumnTitle} ${
                                  section.highlight ? styles.highlighted : ""
                                }`}
                              >
                                {section.title}
                              </h4>
                              <ul className={styles.megaColumnList}>
                                {section.items.map((subItem, subIndex) => (
                                  <li
                                    key={subIndex}
                                    className={styles.megaColumnItem}
                                    onClick={() =>
                                      handleSubItemClick(subItem.path)
                                    }
                                  >
                                    {subItem.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}

              {otherMenuItems.map((item, index) => {
                return (
                  <li
                    key={index + Object.keys(megaMenuData).length}
                    className={`${styles.menuItem} ${
                      item.color ? styles.specialItem : ""
                    }`}
                    style={item.color ? { color: item.color } : {}}
                    onClick={() => handleMainMenuItemClick(item.path)}
                  >
                    {item.text}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.searchContainer}>
              <input
                className={styles.search}
                type="text"
                placeholder="Try searching 'Quantum'"
              />
              <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            </div>

            <div className={styles.icons}>
              <div className={styles.icon} onClick={handleWishlistClick}>
                <FontAwesomeIcon
                  icon={isWishlistFilled ? faHeart : faHeartRegular}
                  className={styles.likeIcon}
                />
                {wishlistCount > 0 && (
                  <span className={styles.iconBadge}>
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </div>
              <div className={styles.icon} onClick={handleCartClick}>
                <FontAwesomeIcon
                  icon={faShoppingBag}
                  className={styles.cartIcon}
                />
                {cartCount > 0 && (
                  <span className={styles.iconBadge}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            {Object.keys(megaMenuData).map((item, index) => (
              <div key={index} className={styles.mobileMenuItem}>
                <div
                  className={styles.mobileMenuHeader}
                  onClick={() => handleMobileMenuClick(item)}
                >
                  <span>{item}</span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`${styles.mobileDropdownIcon} ${
                      activeMenu === item ? styles.rotated : ""
                    }`}
                  />
                </div>
                {activeMenu === item && (
                  <div className={styles.mobileMegaDropdown}>
                    {megaMenuData[item].sections.map(
                      (section, sectionIndex) => (
                        <div
                          key={sectionIndex}
                          className={styles.mobileDropdownColumn}
                        >
                          <h4
                            className={`${styles.mobileColumnTitle} ${
                              section.highlight ? styles.highlighted : ""
                            }`}
                          >
                            {section.title}
                          </h4>
                          <ul className={styles.mobileColumnList}>
                            {section.items.map((subItem, subIndex) => (
                              <li
                                key={subIndex}
                                className={styles.mobileColumnItem}
                                onClick={() => handleSubItemClick(subItem.path)}
                              >
                                {subItem.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}

            {otherMenuItems.map((item, index) => {
              return (
                <div
                  key={index + Object.keys(megaMenuData).length}
                  className={`${styles.mobileSimpleItem} ${
                    item.color ? styles.mobileSpecialItem : ""
                  }`}
                  style={item.color ? { color: item.color } : {}}
                  onClick={() => handleMainMenuItemClick(item.path)}
                >
                  {item.text}
                </div>
              );
            })}

            <div className={styles.mobileSearchContainer}>
              <input
                className={styles.mobileSearch}
                type="text"
                placeholder="Search products..."
              />
              <FontAwesomeIcon
                icon={faSearch}
                className={styles.mobileSearchIcon}
              />
            </div>

            <div className={styles.mobileMenuIcons}>
              <div
                className={styles.mobileIconItem}
                onClick={() => {
                  handleWishlistClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                <FontAwesomeIcon
                  icon={isWishlistFilled ? faHeart : faHeartRegular}
                  className={styles.mobileLikeIcon}
                />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span className={styles.mobileIconBadge}>
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </div>
              <div
                className={styles.mobileIconItem}
                onClick={() => {
                  handleCartClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                <FontAwesomeIcon
                  icon={faShoppingBag}
                  className={styles.mobileCartIcon}
                />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className={styles.mobileIconBadge}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.mobileMenuFooter}>
              <button
                className={styles.mobileCloseButton}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Close Menu
              </button>
            </div>
          </div>
        )}
      </nav>

      {isMobileMenuOpen && (
        <div
          className={styles.mobileMenuOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

export default Navbar;
