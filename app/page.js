"use client";
import React, { useMemo, useState } from "react";

const Home = () => {
  // lokasyon seçimi
  const [locale, setLocale] = useState("Choose your locale");

  // restoranlar (istersen useState ile dışardan da doldurabilirsin)
  const restaurants = useMemo(
    () => [
      {
        id: 1,
        title: "FREEDOM",
        subtitle: "PIZZA",
        img: "/pizza.png",
      },
      {
        id: 2,
        title: "SALAD JAR",
        subtitle: "CHICKEN MEX",
        img: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 3,
        title: "WILDFLOWER",
        subtitle: "BOWLS",
        img: "/bowl.png",
      },
      {
        id: 4,
        title: "GOODNESS",
        subtitle: "HEALTHY MEALS",
        img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 5,
        title: "INKOGNITO",
        subtitle: "BURGER",
        img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 6,
        title: "COCO YOGO",
        subtitle: "FROYO",
        img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 7,
        title: "FREEDOM",
        subtitle: "SANDWICHES",
        img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=1400&auto=format&fit=crop",
      },
      {
        id: 8,
        title: "ENERGY",
        subtitle: "DRINKS",
        img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=1400&auto=format&fit=crop",
      },
    ],
    []
  );

  // basit sepet state’i (sadece toplamları gösteriyoruz)
  const [delivery, setDelivery] = useState(8.57);
  const [subtotal, setSubtotal] = useState(0);
  const vatRate = 0.05;

  const vat = useMemo(() => +(subtotal * vatRate).toFixed(2), [subtotal]);
  const total = useMemo(
    () => +(subtotal + delivery + vat).toFixed(2),
    [subtotal, delivery, vat]
  );

  // demo: bir karta tıklayınca sepete 25 eklesin
  const handleAddSample = () => setSubtotal((s) => s + 25);

  return (
    <div className="min-h-[100dvh] bg-orange-200">
      {/* üst bar */}
      <header className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex items-center gap-2 text-sm text-white ">
          <span>📍</span>
          <span className="opacity-80 text-gray-800">Delivery to:</span>
          <button
            onClick={() =>
              setLocale(
                locale === "Choose your locale"
                  ? "Downtown"
                  : "Choose your locale"
              )
            }
            className="inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1"
          >
            <span className="font-semibold">{locale}</span>
            <span>▾</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl gap-6 px-4 pb-16 pt-4 lg:flex">
        {/* sol içerik */}
        <section className="flex-1">
          <div className="mb-6 rounded-2xl bg-white/70 p-6 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome to Liefrik
            </h1>
            <p className="text-gray-700">
              Your favorite food ordering platform.
            </p>
          </div>

          {/* restoran grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={handleAddSample}
                className="group relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 focus:outline-none"
                title="Demo: Tıkla, sepete 25 eklensin"
              >
                <img
                  src={r.img}
                  alt={r.title}
                  className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 text-left">
                  <div className="text-sm tracking-widest text-white/80">
                    {r.subtitle}
                  </div>
                  <div className="text-2xl font-extrabold text-white drop-shadow">
                    {r.title}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* alt bantlar */}
          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <div className="flex-1 rounded-2xl bg-white/80 p-5 shadow ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍱</span>
                <div>
                  <div className="font-bold text-gray-800">Locale Catering</div>
                  <div className="text-sm text-gray-600">Leave it to us</div>
                </div>
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-white/80 p-5 shadow ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">
                    Tell us what you need
                  </div>
                  <div className="text-sm text-gray-600">
                    (we respond quickly)
                  </div>
                </div>
                <button className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">
                  Chat
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* sağ sabit sepet ve kuponlar */}
        <aside className="sticky top-0 h-[100dvh] w-full max-w-[360px] shrink-0 bg-[#12151a] px-5 pt-6 text-white">
          <div className="rounded-xl bg-[#1b2027] p-4 ring-1 ring-white/5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20 text-rose-300">
                🛒
              </span>
              <span className="font-semibold uppercase tracking-wider">
                Cart
              </span>
            </div>

            <div className="rounded-md bg-[#0f1318] p-3 text-sm text-gray-300">
              {subtotal === 0
                ? "Your Cart is Currently Empty"
                : "Items added (demo)"}
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-medium">Dhs {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery Charge</span>
                <span className="font-medium">Dhs {delivery.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>VAT 5%</span>
                <span className="font-medium">Dhs {vat.toFixed(2)}</span>
              </div>
              <div className="mt-2 border-t border-white/10 pt-3 text-base font-semibold text-white">
                <div className="flex items-center justify-between">
                  <span>TOTAL</span>
                  <span>DHS {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full rounded-lg bg-rose-600 py-3 font-semibold tracking-wide hover:bg-rose-700">
              CHECKOUT
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-md bg-indigo-500/20 px-2 py-1 text-xs font-semibold text-indigo-300">
                COUPONS (12)
              </span>
              <button className="text-xs text-gray-400 hover:text-white">
                ADD COUPON
              </button>
            </div>

            <div className="relative rounded-xl bg-[#1b2027] p-3 ring-1 ring-white/5">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=600&auto=format&fit=crop"
                  alt="coupon"
                  className="h-28 w-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="text-lg font-extrabold leading-5">
                    SPEND 200 GET 50 DHS OFF
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    Spend 200AED, Get 50AED Off
                  </div>
                </div>
              </div>
            </div>

            <button className="mt-3 w-full rounded-lg bg-[#0f1318] py-2 text-sm text-gray-300 ring-1 ring-white/10 hover:bg-[#0b0f13]">
              VIEW ALL
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Home;
