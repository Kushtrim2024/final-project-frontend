"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faUser,
  faStore,
  faAngleDown,
  faRightFromBracket,
  faGear,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

/** ====== CONFIG ====== */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5517";

const SETTINGS_ROUTE_BY_ROLE = {
  restaurant: "/restaurantmanagement",
  user: "/usermanagement",
  admin: "/admin",
};

const CATEGORIES = [
  { label: "Burger", icon: "/burger.png" },
  { label: "Doner", icon: "/doner.png" },
  { label: "Chicken", icon: "/chicken.png" },
  { label: "Pizza", icon: "/pizza.png" },
  { label: "Sushi", icon: "/sushi.png" },
  { label: "Pasta", icon: "/pasta.png" },
  { label: "Salad", icon: "/salad.png" },
  { label: "Vegan", icon: "/vegan.png" },
  { label: "Vegetarian", icon: "/vegetarian.png" },
  { label: "Seafood", icon: "/seafood.png" },
];

/** ====== Helpers ====== */
function slugify(text) {
  return (text || "")
    .toString()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
/** ---------- Cart helpers (localStorage) ---------- */
const CART_KEY = "liefrik_cart_v1";

function readCart() {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(CART_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safeJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(
      decodeURIComponent(
        [...json]
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      )
    );
  } catch {
    return null;
  }
}

function normalizeRole(r, obj) {
  const s = (r || "").toString().toLowerCase();
  if (
    ["restaurant", "owner", "restaurantowner", "restaurant_owner"].includes(s)
  )
    return "restaurant";
  if (["user", "customer"].includes(s)) return "user";
  if (!s && (obj?.restaurantId || obj?.restaurant || obj?.ownerId))
    return "restaurant";
  return s || null;
}

// role-aware display name
function pickDisplayName(u) {
  const role = (u?.role || "").toLowerCase();
  if (role === "restaurant") {
    return (
      u?.ownerName ||
      u?.restaurantName ||
      u?.name ||
      u?.fullName ||
      u?.username ||
      u?.email ||
      null
    );
  }
  return u?.name || u?.fullName || u?.username || u?.email || null;
}

function mergeUserShape(anyJson) {
  const u =
    anyJson?.user ||
    anyJson?.data ||
    anyJson?.owner ||
    anyJson?.restaurantOwner ||
    anyJson?.profile ||
    anyJson ||
    {};
  const out = {
    id: u.id || u._id || u.userId || null,
    name: pickDisplayName(u),
    role: normalizeRole(u.role || u.type, u),
    restaurantId: u.restaurantId || u.ownerId || null,
    email: u.email || null,
    restaurantName: u.restaurantName || null,
    ownerName:
      u.ownerName ||
      u?.owner?.name ||
      (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null) ||
      null,
  };
  if (!out.role && (u.restaurantId || u.ownerId)) out.role = "restaurant";
  if (!out.role) out.role = "user";
  return out;
}

/** localStorage + JWT (bootstrap) */
function getAuthLocal() {
  const auth = safeJson(localStorage.getItem("auth")) || {};
  const userObj =
    safeJson(localStorage.getItem("user")) ||
    safeJson(localStorage.getItem("customer")) ||
    null;
  const ownerObj =
    safeJson(localStorage.getItem("restaurantOwner")) ||
    safeJson(localStorage.getItem("owner")) ||
    null;

  const token =
    auth.token ||
    auth.accessToken ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    null;

  const userLike = { ...auth.user, ...auth, ...userObj, ...ownerObj };
  let role = normalizeRole(
    auth.role ||
      userObj?.role ||
      ownerObj?.role ||
      localStorage.getItem("role"),
    userLike
  );
  let name =
    auth.name ||
    pickDisplayName(userLike) ||
    localStorage.getItem("username") ||
    null;
  let restaurantId =
    auth.restaurantId ||
    userObj?.restaurantId ||
    ownerObj?.restaurantId ||
    null;

  if (token) {
    const claims = parseJwt(token);
    if (claims) {
      role = normalizeRole(role || claims.role || claims.type, claims);
      name = name || pickDisplayName(claims);
      restaurantId = restaurantId || claims.restaurantId || null;
    }
  }
  return { token, role, name, restaurantId };
}

async function fetchMe(token) {
  const endpoints = [
    "/auth/me",
    "/users/me",
    "/owners/me",
    "/restaurant-owners/me",
    "/profile",
    "/me",
    "/api/me",
  ];
  for (const p of endpoints) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        return { ok: true, user: mergeUserShape(json) };
      }
    } catch {}
  }
  return { ok: false, user: null };
}

export default function Header() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const catFromUrl = searchParams.get("cat");
  const defaultActive = slugify(CATEGORIES[0].label);

  const [active, setActive] = useState(catFromUrl || defaultActive);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const railRef = useRef(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [displayName, setDisplayName] = useState(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false);
  const userMenuRef = useRef(null);
  const restMenuRef = useRef(null);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // CART icon counter--------------------------------------------------
  const [cartItems, setCartItems] = useState([]);
  const cartCount = useMemo(() => {
    return Array.isArray(cartItems)
      ? cartItems.reduce((sum, it) => sum + (Number(it.qty) || 1), 0)
      : 0;
  }, [cartItems]);

  useEffect(() => {
    setCartItems(readCart());

    function handleStorage(e) {
      if (e.key === CART_KEY) {
        try {
          const arr = e.newValue ? JSON.parse(e.newValue) : [];
          setCartItems(Array.isArray(arr) ? arr : []);
        } catch {
          setCartItems([]);
        }
      }
    }
    function handleFocus() {
      setCartItems(readCart());
    }
    function handleCartChange() {
      setCartItems(readCart());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("cart:change", handleCartChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("cart:change", handleCartChange);
    };
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || window.__cartPatched) return;
    window.__cartPatched = true;

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === "liefrik_cart_v1") {
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event("cart:change"));
        });
      }
    };
  }, []);
  // ------------------------------------------------------
  useEffect(() => setActive(catFromUrl || defaultActive), [catFromUrl]);

  const updateIndicator = (slug) => {
    const rail = railRef.current;
    if (!rail) return;
    const el = rail.querySelector(`[data-slug="${slug}"]`);
    if (!el) return;
    const railBox = rail.getBoundingClientRect();
    const elBox = el.getBoundingClientRect();
    setIndicator({
      left: elBox.left - railBox.left + rail.scrollLeft,
      width: elBox.width,
    });
  };
  useEffect(() => {
    updateIndicator(active);
  }, [active]);
  useEffect(() => {
    const onResize = () => updateIndicator(active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (restMenuRef.current && !restMenuRef.current.contains(e.target)) {
        setShowRestaurantMenu(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    async function run() {
      const local = getAuthLocal();
      setToken(local.token || null);
      if (local.role) setRole(local.role);
      if (local.name) setDisplayName(local.name);

      const { ok, user } = await fetchMe(local.token);
      if (ok && user) {
        setRole(user.role || local.role || null);
        setDisplayName(pickDisplayName(user) || local.name || null);
      }
      setAuthChecked(true);
    }
    run();

    function onStorage(e) {
      if (
        [
          "auth",
          "token",
          "accessToken",
          "jwt",
          "role",
          "username",
          "user",
          "restaurantOwner",
          "owner",
          "customer",
        ].includes(e.key)
      ) {
        run();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const buildHrefWithCat = (slug) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("cat", slug);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  };

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      }).catch(() => {});
    } catch {}
    try {
      [
        "auth",
        "token",
        "accessToken",
        "jwt",
        "role",
        "username",
        "user",
        "restaurantOwner",
        "owner",
        "customer",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}
    setToken(null);
    setRole(null);
    setDisplayName(null);
    setShowUserMenu(false);
    setShowRestaurantMenu(false);
    setShowMobileMenu(false);
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  const settingsHref = (role && SETTINGS_ROUTE_BY_ROLE[role]) || "/settings";

  const LoadingDots = () => (
    <span className="inline-flex gap-0.5 align-middle ml-1">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:120ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:240ms]" />
    </span>
  );

  // Prevent background scroll when mobile menu is open (fixed)
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  // NEW: Auto-close mobile menu when viewport exceeds 1000px (runs on resize and once on mount)
  useEffect(() => {
    function autoCloseOnWide() {
      if (window.innerWidth > 1000) {
        setShowMobileMenu(false);
      }
    }
    window.addEventListener("resize", autoCloseOnWide);
    autoCloseOnWide(); // ensure correct state on first render
    return () => window.removeEventListener("resize", autoCloseOnWide);
  }, []);

  return (
    <header className="fixed top-0 z-50 flex flex-col w-full h-36 transition-colors duration-300 bg-orange-200/25 backdrop-blur-md shadow-md text-sm ">
      <div className="relative w-full h-32 flex items-center justify-center mt-2 mx-auto max-[100px]:mt-10 ">
        {/* Mobile: Hamburger */}
        <button
          className="absolute right-3 top-4 p-2 rounded-xl bg-white/70 shadow max-[1000px]:flex hidden items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-400"
          aria-label="Open menu"
          aria-expanded={showMobileMenu}
          aria-controls="mobile-menu"
          onClick={() => setShowMobileMenu(true)}
        >
          <FontAwesomeIcon icon={faBars} className="h-5 w-5 text-gray-800" />
        </button>

        {/* Logo */}
        <section className="absolute bottom-[-15px] left-15 h-36 w-34 flex items-center justify-left max-[1000px]:scale-85 max-[1000px]:left-[15px] max-[650px]:scale-70 max-[600px]:left-[-5px] max-[600px]:top-[-15px]">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Liefrik Logo"
              width={140}
              height={140}
              className="h-22 w-22 transition-all duration-200 transform hover:translate-y-1 cursor-pointer  "
            />
          </Link>
        </section>

        {/* categories (hidden on mobile) */}
        <nav
          aria-label="Categories"
          className="relative flex-wrap justify-center max-[1000px]:hidden   "
        >
          <ul
            ref={railRef}
            className="flex gap-10  max-[1300px]:gap-6 max-[1100px]:gap-6 justify-center relative px-4"
          >
            <span
              aria-hidden
              className="absolute -bottom-1 h-[2px] bg-red-400 rounded-full transition-all duration-300 "
              style={{ left: indicator.left, width: indicator.width }}
            />
            {CATEGORIES.map((c) => {
              const slug = slugify(c.label);
              const isActive = active === slug;
              const href = buildHrefWithCat(slug);
              return (
                <li key={slug}>
                  <Link
                    data-slug={slug}
                    href={href}
                    onMouseEnter={() => updateIndicator(slug)}
                    onMouseLeave={() => updateIndicator(active)}
                    className={`group flex flex-col items-center transition-all duration-300 ${
                      isActive
                        ? "text-orange-500 scale-105"
                        : "text-gray-800 hover:text-red-500 hover:scale-105"
                    }`}
                  >
                    <Image
                      src={c.icon}
                      alt={c.label}
                      width={110}
                      height={110}
                      className="h-16 w-16 object-contain mb-1 drop-shadow-md transition-transform group-hover:scale-110 max-[1700px]:h-12 max-[1700px]:w-12 max-[1550px]:h-10 max-[1550px]:w-10  max-[1100px]:h-8 max-[1100px]:w-8"
                    />
                    <span className="text-xs font-medium tracking-tight">
                      {c.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* right actions (hidden on mobile) */}
        <section className="absolute right-0 bottom-5 space-x-2 w-60  flex flex-col items-start justify-center max-[1000px]:hidden gap-2 max-[1700]:text-xs max-[1700]:w-45   ">
          {/* Restaurant owner----------------header---------------------------------------------------------- */}
          {authChecked ? (
            role === "restaurant" ? (
              <div className="relative" ref={restMenuRef}>
                <button
                  className="text-gray-800 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer rounded-md py-1"
                  onClick={() => {
                    setShowRestaurantMenu((v) => !v);
                    setShowUserMenu(false);
                  }}
                >
                  <FontAwesomeIcon icon={faStore} className="h-4 w-4 mr-1" />
                  <span className="hidden min-[1000px]:block font-medium">
                    {displayName || "Owner"}
                  </span>
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="h-3 w-3 ml-1"
                  />
                </button>
                {showRestaurantMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black/10 overflow-hidden z-99 ">
                    <Link
                      href={settingsHref}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                      onClick={() => setShowRestaurantMenu(false)}
                    >
                      <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        className="h-4 w-4"
                      />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/partnerwithus"
                className="text-gray-800 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
              >
                <FontAwesomeIcon icon={faStore} className="h-4 w-4 mr-0.5" />
                <span className="hidden min-[1000px]:block">
                  Partner with us
                </span>
              </Link>
            )
          ) : (
            <div className="text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faStore} className="h-4 w-4 mr-1" />
              <span className="hidden min-[1000px]:block">
                Loading
                <LoadingDots />
              </span>
            </div>
          )}

          {/* User */}
          {authChecked ? (
            role === "user" ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  className="text-gray-800 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer rounded-md py-1"
                  onClick={() => {
                    setShowUserMenu((v) => !v);
                    setShowRestaurantMenu(false);
                  }}
                >
                  <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-1" />
                  <span className="hidden min-[1000px]:block font-medium">
                    {displayName || "Account"}
                  </span>
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="h-3 w-3 ml-1"
                  />
                </button>
                {showUserMenu && (
                  <div className="absolute left-0 right-0 mt-1 w-28 rounded-lg bg-white shadow-lg ring-1 ring-black/10 overflow-hidden z-99">
                    <Link
                      href={settingsHref}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-800 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        className="h-4 w-4"
                      />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-gray-800 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
              >
                <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-1" />
                <span className="hidden min-[1000px]:block">Account</span>
              </Link>
            )
          ) : (
            <div className="text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-1" />
              <span className="hidden min-[1000px]:block">
                Loading
                <LoadingDots />
              </span>
            </div>
          )}

          {/* cart */}
          <Link
            href="/checkout"
            className="text-gray-800 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer mt-1"
            aria-label="Cart"
          >
            <span className="relative inline-block pr-0.5 ">
              <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 text-red-400 font-bold ">
                {cartCount}
              </span>
            </span>
            <span className="hidden min-[1000px]:block ml-1 ">
              Shopping Cart
            </span>
          </Link>
        </section>
      </div>

      {/* ===== Mobile Fullscreen Menu ===== */}
      {showMobileMenu && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-200">
            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              className="flex items-center gap-2"
            >
              <Image
                src="/logo.png"
                alt="Liefrik Logo"
                width={50}
                height={50}
              />
            </Link>
            <button
              className="p-2 rounded-xl bg-white/70 shadow focus:outline-none focus:ring-2 focus:ring-orange-400"
              aria-label="Close menu"
              onClick={() => setShowMobileMenu(false)}
            >
              <FontAwesomeIcon
                icon={faXmark}
                className="h-5 w-5 text-gray-800"
              />
            </button>
          </div>

          {/* Sections */}
          <div className="overflow-y-auto h-96 bg-white">
            {/* Categories */}
            <div className="px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Category
              </h2>
              <ul className="flex-1/5 gap-3">
                {CATEGORIES.map((c) => {
                  const slug = slugify(c.label);
                  const href = buildHrefWithCat(slug);
                  const isActive = active === slug;
                  return (
                    <li key={slug}>
                      <Link
                        href={href}
                        className={`flex flex-col items-center rounded-xl border ${
                          isActive ? "border-orange-400" : "border-transparent"
                        } bg-white shadow-sm px-2 py-3 active:scale-[0.98] transition`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Image
                          src={c.icon}
                          alt={c.label}
                          width={48}
                          height={48}
                          className="h-10 w-10 object-contain"
                        />
                        <span className="mt-1 text-[16px] font-medium text-gray-800">
                          {c.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Account / Owner */}
            <div className="px-4 py-3 border-t border-orange-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Account
              </h2>
              {!authChecked ? (
                <div className="text-gray-700 text-sm flex items-center">
                  Loading <LoadingDots />
                </div>
              ) : role === "restaurant" ? (
                <div className="flex flex-col gap-2">
                  {/* NEW: Signed-in name (Restaurant) */}
                  <div className="flex items-center gap-2 mb-1 text-gray-800">
                    <FontAwesomeIcon icon={faStore} className="h-4 w-4" />
                    <span className="font-medium">
                      {displayName || "Owner"}
                    </span>
                  </div>

                  <Link
                    href={settingsHref}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-orange-100"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    className="flex items-center gap-2 rounded-lg bg-red-50 text-red-700 px-3 py-2 shadow-sm border border-red-100"
                    onClick={handleLogout}
                  >
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      className="h-4 w-4"
                    />
                    <span>Logout</span>
                  </button>
                </div>
              ) : role === "user" ? (
                <div className="flex flex-col gap-2">
                  {/* NEW: Signed-in name (User) */}
                  <div className="flex items-center gap-2 mb-1 text-gray-800">
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                    <span className="font-medium">
                      {displayName || "Account"}
                    </span>
                  </div>

                  <Link
                    href={settingsHref}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm border border-orange-100"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    className="flex items-center gap-2 rounded-lg bg-red-50 text-red-700 px-3 py-2 shadow-sm border border-red-100"
                    onClick={handleLogout}
                  >
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                      className="h-4 w-4"
                    />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center rounded-lg bg-white px-3 py-2 shadow-sm border border-orange-100"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 mr-1" />
                    Account
                  </Link>
                  <Link
                    href="/partnerwithus"
                    className="flex-1 text-center rounded-lg bg-white px-3 py-2 shadow-sm border-pink-200 "
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <FontAwesomeIcon icon={faStore} className="h-4 w-4 mr-1" />
                    Partner with us
                  </Link>
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="px-4 py-3 border-t border-orange-100">
              <Link
                href="/checkout"
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-orange-100 active:scale-[0.99]"
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="flex items-center gap-3 border border-pink-100 rounded-full px-3 py-1 bg-pink-100">
                  <span className="relative inline-block">
                    <FontAwesomeIcon
                      icon={faShoppingCart}
                      className="h-5 w-5"
                    />
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 text-center text-red-500 font-bold ">
                      {cartCount}
                    </span>
                  </span>

                  <span>Shopping Cart</span>
                </div>
                <span className="text-xs text-gray-500">Open</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
