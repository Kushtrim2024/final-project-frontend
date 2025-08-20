"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { CartProvider } from "../contexte/CartContext"; // neu

export default function RootLayoutWrapper({ children }) {
  const pathname = usePathname();
  const hiddenPaths = [
    "/login",
    "/register",
    "/management",
    "/partnerwithus",
    "/usermanagement",
    "/usermanagement/users",
    "/usermanagement/roles",
    "/usermanagement/permissions",
    "/restaurantmanagement",
    "/restaurantmanagement/restaurants",
    "/restaurantmanagement/restaurantpro",
    "/restaurantmanagement/ordermanagement",
    "/restaurantmanagement/customerfeedback",
    "/restaurantmanagement/openinghours",
    "/restaurantmanagement/pricingpromo",
    "/admin",
    "/admin/restaurants",
    "/admin/roles",
    "/admin/permissions",
  ];
  const shouldHideLayout = hiddenPaths.includes(pathname);

  return (
    <CartProvider>
      {!shouldHideLayout && <Header />}
      {children}
      {!shouldHideLayout && <Footer />}
    </CartProvider>
  );
}
