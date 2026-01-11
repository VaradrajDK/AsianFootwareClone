import React from "react";

import Footer from "../Footer";
import "./MainLayout.css";
import Header from "../Header";

const MainLayout = ({ children }) => {
  return (
    <div className="mainLayout">
      <Header />
      <main className="mainContentArea">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
