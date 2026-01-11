import React from "react";
import styles from "../Styles/Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footerContainer}>
      {/* 80% WIDTH WRAPPER */}
      <div className={styles.footerWrapper}>
        {/* MAIN CONTENT */}
        <div className={styles.footerMain}>
          {/* LEFT */}
          <div className={styles.footerLeft}>
            <img
              src="https://www.asianfootwears.com/_next/static/media/asian-wave-white.e9ed6354.png"
              alt="Asian Logo"
              className={styles.footerLogo}
            />

            <p className={styles.footerDescription}>
              Asian is one of the fastest growing and the most loved footwear
              brands in India. Check out our incredible range and become an
              AsianRider today.
            </p>

            <div className={styles.footerSocial}>
              <i className="fa-brands fa-linkedin"></i>
              <i className="fa-brands fa-instagram"></i>
              <i className="fa-brands fa-youtube"></i>
              <i className="fa-brands fa-x-twitter"></i>
            </div>
          </div>

          {/* RIGHT */}
          <div className={styles.footerRight}>
            <div className={styles.footerContact}>
              <h3>For inquiries about refunds, order issues:</h3>
              <p>
                <i className="fa-solid fa-phone"></i> +91 7561000092
              </p>
              <p>
                <i className="fa-solid fa-envelope"></i> info@asianfootwears.com
              </p>
              <p>
                <i className="fa-solid fa-location-dot"></i>
                J-20, Udhyog Nagar, Peeragarhi, Delhi, New Delhi - 110041
              </p>
            </div>

            <div className={styles.footerContact}>
              <h3>Corporate / Bulk Purchases:</h3>
              <p>
                <i className="fa-solid fa-phone"></i> +91 9996027231
              </p>
            </div>

            <div className={styles.footerLinks}>
              <h3>Quick Links</h3>
              <ul>
                <li>Privacy Policy</li>
                <li>Refund Policy</li>
                <li>Shipping Policy</li>
                <li>Terms of Service</li>
                <li>Corporate / Bulk Orders</li>
                <li>Track Order</li>
                <li>Blog</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className={styles.footerBottom}>
          © 2025 Asian Footwears Pvt. Ltd. All Rights Reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
