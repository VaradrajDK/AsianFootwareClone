// src/Components/Filter.jsx
import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import styles from "../Styles/Filters.module.css";

function Filters({
  onGenderChange,
  onSortChange,
  onSizeSelect,
  onPriceSelect,
  onTypeSelect,
  selectedGender,
  selectedSort,
  selectedTypes,
  selectedSizes,
  priceRange,
  onClearAll,
}) {
  const [openGender, setOpenGender] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [openSize, setOpenSize] = useState(true);
  const [openType, setOpenType] = useState(true);

  const handleSizeClick = (size) => {
    let newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    onSizeSelect(newSizes);
  };

  const handleTypeChange = (type) => {
    let newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onTypeSelect(newTypes);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      selectedGender !== "Men" ||
      selectedTypes.length > 0 ||
      selectedSizes.length > 0 ||
      priceRange !== "all" ||
      (selectedSort !== "relevance" && selectedSort !== "newArrivals")
    );
  };

  // Gender options matching database values
  const genderOptions = [
    { value: "Men", label: "Men's" },
    { value: "Women", label: "Women's" },
    { value: "Kids", label: "Kids" },
  ];

  return (
    <div className={styles.filtersContainer}>
      {/* Filter Header with Clear All */}
      <div className={styles.filterHeader}>
        <h2 className={styles.filterTitle}>Filters</h2>
        <div className={styles.headerButtons}>
          {hasActiveFilters() && (
            <button className={styles.clearAllButton} onClick={onClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Sort By */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Sort By</h3>
        {[
          { value: "relevance", label: "Relevance" },
          { value: "highToLow", label: "High To Low Price" },
          { value: "lowToHigh", label: "Low To High Price" },
          { value: "newArrivals", label: "New Arrivals" },
        ].map((item) => (
          <label key={item.value} className={styles.sortOption}>
            <input
              type="radio"
              name="sort"
              value={item.value}
              checked={selectedSort === item.value}
              onChange={(e) => onSortChange(e.target.value)}
              className={styles.sortInput}
            />
            <span className={styles.checkmark}></span>
            {item.label}
          </label>
        ))}
      </div>

      <div className={styles.divider}></div>

      {/* Gender */}
      <div className={styles.section}>
        <div
          className={styles.toggleHeader}
          onClick={() => setOpenGender(!openGender)}
        >
          <h3 className={styles.toggleTitle}>Gender</h3>
          {openGender ? <FaChevronUp /> : <FaChevronDown />}
        </div>

        {openGender && (
          <div className={styles.genderOptions}>
            {genderOptions.map((g) => (
              <label key={g.value} className={styles.genderOption}>
                <input
                  type="radio"
                  name="gender"
                  checked={selectedGender === g.value}
                  onChange={() => onGenderChange(g.value)}
                  className={styles.sortInput}
                />
                <span className={styles.checkmark}></span>
                {g.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider}></div>

      {/* Price Range */}
      <div className={styles.section}>
        <div
          className={styles.toggleHeader}
          onClick={() => setOpenPrice(!openPrice)}
        >
          <h3 className={styles.toggleTitle}>Price Range</h3>
          {openPrice ? <FaChevronUp /> : <FaChevronDown />}
        </div>

        {openPrice && (
          <div className={styles.priceGrid}>
            {[
              { key: "all", label: "All" },
              { key: "under1000", label: "Under ₹1000" },
              { key: "1001-1500", label: "₹1001 - ₹1500" },
              { key: "1500-2000", label: "₹1500 - ₹2000" },
              { key: "above2000", label: "Above ₹2000" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => onPriceSelect(p.key)}
                className={`${styles.priceButton} ${
                  priceRange === p.key ? styles.selected : ""
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider}></div>

      {/* Size */}
      <div className={styles.section}>
        <div
          className={styles.toggleHeader}
          onClick={() => setOpenSize(!openSize)}
        >
          <h3 className={styles.toggleTitle}>Size (UK)</h3>
          {openSize ? <FaChevronUp /> : <FaChevronDown />}
        </div>

        {openSize && (
          <div className={styles.sizeGrid}>
            {[
              "4 UK",
              "5 UK",
              "6 UK",
              "7 UK",
              "8 UK",
              "9 UK",
              "10 UK",
              "11 UK",
              "12 UK",
            ].map((size) => (
              <button
                key={size}
                onClick={() => handleSizeClick(size)}
                className={`${styles.sizeButton} ${
                  selectedSizes.includes(size) ? styles.selected : ""
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.divider}></div>

      {/* Shoe Type */}
      <div className={styles.section}>
        <div
          className={styles.toggleHeader}
          onClick={() => setOpenType(!openType)}
        >
          <h3 className={styles.toggleTitle}>Shoe Type</h3>
          {openType ? <FaChevronUp /> : <FaChevronDown />}
        </div>

        {openType && (
          <div className={styles.typeOptions}>
            {[
              "Sports Shoes",
              "Slippers",
              "Casual Shoes",
              "Kids Shoes",
              "Sandals",
            ].map((type) => (
              <label key={type} className={styles.typeOption}>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeChange(type)}
                  className={styles.typeInput}
                />
                <span className={styles.checkbox}></span>
                {type}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <>
          <div className={styles.divider}></div>
          <div className={styles.activeFilters}>
            <h3 className={styles.activeFiltersTitle}>Active Filters:</h3>
            <div className={styles.activeFiltersList}>
              {selectedGender !== "Men" && (
                <span className={styles.activeFilter}>
                  Gender: {selectedGender}
                </span>
              )}
              {selectedTypes.map((type) => (
                <span key={type} className={styles.activeFilter}>
                  {type}
                </span>
              ))}
              {selectedSizes.map((size) => (
                <span key={size} className={styles.activeFilter}>
                  {size}
                </span>
              ))}
              {priceRange !== "all" && (
                <span className={styles.activeFilter}>Price: {priceRange}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Filters;
