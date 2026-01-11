import React from "react";

import AllProducts from "../../Components/AllProducts";
import PageNavigation from "../../Components/PageNavigation";
import Header from "../../Components/Header";

const PublicProducts = () => {
  return (
    <>
      <Header />
      <PageNavigation />
      <AllProducts />
    </>
  );
};

export default PublicProducts;
