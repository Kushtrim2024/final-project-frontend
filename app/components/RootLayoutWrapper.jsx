"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function RootLayoutWrapper({ children }) {
  const pathname = usePathname();
  const hiddenPaths = [
    "/login",
    "/register",
    "/management",
    "/partnerwithus",
    "/usermanagement",
    "/restaurantmanagement",
    "/admin",
    "/admin/dashboard",
    "/admin/usermanagement",
    "/admin/restaurantmanagement",
    "/admin/ordermanagement",
    "/admin/paymentscommissionreports",
    "/admin/supportfeedback",
    "/admin/usermanagement/admin",
    "/admin/usermanagement/kunden",
    "/admin/usermanagement/restaurant",
    "/restaurantmanagement/restaurants",
    "/restaurantmanagement/pricingpromo",
    "/restaurantmanagement/customerfeedback",
    "/restaurantmanagement/ordermanagement",
    "/restaurantmanagement/openinghours",
    "/restaurantmanagement/restaurantpro",
    "/restaurantmanagement/ownerprofile",
    "/usermanagement/profile",
    "/usermanagement/paymentmethods",
    "/usermanagement/address",
    "/usermanagement/orderhistory",
    "/usermanagement/settings",
  ];
  const shouldHideLayout = hiddenPaths.includes(pathname);

  return (
    <>
      {!shouldHideLayout && <Header />}
      {children}
      {!shouldHideLayout && <Footer />}
    </>
  );
}
