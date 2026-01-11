import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../Styles/PageNavigation.module.css";

function PageNavigation() {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Function to parse query parameters
  const parseQueryParams = (search) => {
    const params = new URLSearchParams(search);
    return {
      gender: params.get("gender"),
      type: params.get("type"),
      sort: params.get("sort"),
    };
  };

  // Function to format text
  const formatText = (text) => {
    if (!text) return "";
    return text
      .split(/[\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Create breadcrumbs with query parameters
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    const queryParams = parseQueryParams(location.search);
    const breadcrumbs = [];

    // Always add Home
    breadcrumbs.push({
      name: "Home",
      path: "/",
      isLast: pathnames.length === 0,
    });

    // Check if we're on products page or have product-related query params
    const isProductsPage =
      pathnames.includes("products") ||
      queryParams.gender ||
      queryParams.type ||
      queryParams.sort;

    if (isProductsPage) {
      // Add Products breadcrumb
      breadcrumbs.push({
        name: "Products",
        path: "/products",
        isLast: !queryParams.gender && !queryParams.type && !queryParams.sort,
      });

      // Add Gender breadcrumb if exists
      if (queryParams.gender) {
        const genderPath = `/products?gender=${queryParams.gender}`;
        breadcrumbs.push({
          name: formatText(queryParams.gender),
          path: genderPath,
          isLast:
            !queryParams.type &&
            (!queryParams.sort || queryParams.sort === "relevance"),
        });

        // Add Type breadcrumb if exists
        if (queryParams.type) {
          const types = queryParams.type.split(",");
          const typePath = `${genderPath}&type=${queryParams.type}`;

          if (types.length === 1) {
            // Single type
            breadcrumbs.push({
              name: formatText(types[0]),
              path: typePath,
              isLast: !queryParams.sort || queryParams.sort === "relevance",
            });
          } else {
            // Multiple types
            breadcrumbs.push({
              name: `${formatText(types[0])} +${types.length - 1}`,
              path: typePath,
              isLast: !queryParams.sort || queryParams.sort === "relevance",
            });
          }
        }

        // Add Sort breadcrumb if exists and different from default
        if (queryParams.sort && queryParams.sort !== "relevance") {
          const sortLabels = {
            highToLow: "High to Low Price",
            lowToHigh: "Low to High Price",
            newArrivals: "New Arrivals",
          };
          breadcrumbs.push({
            name: sortLabels[queryParams.sort] || formatText(queryParams.sort),
            path: location.pathname + location.search,
            isLast: true,
          });
        }
      } else if (queryParams.type) {
        // If there's type but no gender
        breadcrumbs.push({
          name: formatText(queryParams.type),
          path: location.pathname + location.search,
          isLast: !queryParams.sort || queryParams.sort === "relevance",
        });

        if (queryParams.sort && queryParams.sort !== "relevance") {
          const sortLabels = {
            highToLow: "High to Low Price",
            lowToHigh: "Low to High Price",
            newArrivals: "New Arrivals",
          };
          breadcrumbs.push({
            name: sortLabels[queryParams.sort] || formatText(queryParams.sort),
            path: location.pathname + location.search,
            isLast: true,
          });
        }
      } else if (queryParams.sort && queryParams.sort !== "relevance") {
        // If there's only sort (no gender, no type)
        const sortLabels = {
          highToLow: "High to Low Price",
          lowToHigh: "Low to High Price",
          newArrivals: "New Arrivals",
        };
        breadcrumbs.push({
          name: sortLabels[queryParams.sort] || formatText(queryParams.sort),
          path: location.pathname + location.search,
          isLast: true,
        });
      }
    } else if (pathnames.length > 0) {
      // Original logic for other pages (non-products)
      pathnames.forEach((segment, index) => {
        breadcrumbs.push({
          name: formatText(segment),
          path: `/${pathnames.slice(0, index + 1).join("/")}`,
          isLast: index === pathnames.length - 1,
        });
      });
    }

    // Mark the last breadcrumb as current
    if (breadcrumbs.length > 0) {
      const lastIndex = breadcrumbs.length - 1;
      breadcrumbs.forEach((crumb, index) => {
        crumb.isLast = index === lastIndex;
      });
    }

    return breadcrumbs;
  };

  // Update breadcrumbs when location changes
  useEffect(() => {
    setBreadcrumbs(generateBreadcrumbs());
  }, [location]);

  return (
    <div className={styles.pageNavigation}>
      <nav className={styles.centerBox}>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className={styles.breadcrumbItem}>
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link to={crumb.path} className={styles.link}>
                  {crumb.name}
                </Link>
                <span className={styles.separator}>/</span>
              </>
            ) : (
              <span className={styles.current}>{crumb.name}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}

export default PageNavigation;
