import React, { useState, useEffect, useRef } from "react";
import styles from "../Styles/Header.module.css";
import Topbar from "./Header/TopBar";
import OfferBar from "./Header/OfferBar";
import Navbar from "./Header/Navbar";

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Add shadow when scrolled
      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Show header when scrolling stops
      scrollTimeout.current = setTimeout(() => {
        setIsHeaderVisible(true);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <>
      <header
        className={`${styles.header} ${
          isScrolled ? styles.headerScrolled : ""
        } ${isHeaderVisible ? styles.headerVisible : styles.headerHidden}`}
      >
        <OfferBar />
        <Topbar />
        <Navbar />
      </header>
      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className={styles.headerSpacer}></div>
    </>
  );
}

export default Header;
