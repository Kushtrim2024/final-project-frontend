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
    "/usermanagement/users",
    "/usermanagement/roles",
    "/usermanagement/permissions",
    "/restaurantmanagement",
    "/restaurantmanagement/restaurants",
    "/restaurantmanagement/roles",
    "/restaurantmanagement/permissions",
    "/admin",
    "/admin/restaurants",
    "/admin/roles",
    "/admin/permissions",
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
