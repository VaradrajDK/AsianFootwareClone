import React from "react";
import BannerSlider from "../Components/Home/BannerSlider";
import ProductGrid from "../Components/Home/ProductGrid";
import ShopFor from "../Components/Home/ShopFor";
import NewArrivals from "../Components/Home/NewArrivals";
import BestSellers from "../Components/Home/BestSellers";
import Footer from "../Components/Footer";
import Header from "../Components/Header";

const Home = () => {
  return (
    <>
      <Header />
      <BannerSlider />
      <ProductGrid />
      <ShopFor />
      <NewArrivals />
      <BestSellers />
      <Footer />
    </>
  );
};

export default Home;
