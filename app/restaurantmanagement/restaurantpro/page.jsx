"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

/* =============================================================================
   API endpoints
============================================================================= */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5517";
const API_GET = `${API_BASE}/owner/profile`; // GET -> { owner, restaurant }
const API_PUT = `${API_BASE}/owner/profile/update`; // PUT -> your existing backend

/* =============================================================================
   Cloudinary (unsigned) upload settings (frontend only)
============================================================================= */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; // e.g. "my-cloud"
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; // e.g. "liefrik_cover"
const CLOUD_UPLOAD_URL = CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  : null;

/* Per-restaurant localStorage key helper (stable) */
// NEW: always store/read cover by restaurant id, so each restaurant has its own cover
const coverKey = (rid) =>
  rid ? `restaurant_cover_photo_${rid}` : "restaurant_cover_photo_fallback";

export default function RestaurantProfile() {
  /* Cover image state */
  const [coverPhoto, setCoverPhoto] = useState(null); // permanent URL (Cloudinary or API)
  const [coverFile, setCoverFile] = useState(null); // selected File
  const [coverPreview, setCoverPreview] = useState(null); // local preview (object URL)
  const previewUrlRef = useRef(null);

  /* Restaurant/Owner/basic fields */
  const [restaurantId, setRestaurantId] = useState(null); // NEW: we need this for per-restaurant key
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisines, setCuisines] = useState([]);
  const [minOrder, setMinOrder] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [owner, setOwner] = useState(null);

  /* UI state */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const cuisineOptions = [
    "Turkish",
    "Vegan",
    "Pizza",
    "Dessert",
    "Sushi",
    "Burgers",
  ];

  const readJsonSafe = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }
    try {
      return { error: (await res.text()) || "Unknown server response" };
    } catch {
      return null;
    }
  };

  /* =============================================================================
     Load profile (reads API coverPhoto first; then per-restaurant localStorage)
  ============================================================================= */
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in.");
          setLoading(false);
          return;
        }

        const res = await fetch(API_GET, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: ac.signal,
          cache: "no-store",
        });

        const parsed = await readJsonSafe(res);
        if (!res.ok) {
          const serverMsg = parsed?.error || parsed?.message || "";
          setError(
            `Failed to load profile (${res.status} ${res.statusText}) ${serverMsg}`.trim()
          );
          setLoading(false);
          return;
        }

        const data = parsed || {};
        const r = data.restaurant || {};
        const rid =
          r._id || r.id || r.restaurantId || r.ownerId || r.slug || null; // CHANGED: try common id fields
        setRestaurantId(rid); // NEW

        setOwner(data.owner || null);
        setName(r.name || r.restaurantName || "");
        setDescription(r.description || "");
        setCuisines(Array.isArray(r.cuisines) ? r.cuisines : []);
        setMinOrder(r.minOrder ?? "");
        setDeliveryTime(r.deliveryTime ?? "");
        setDeliveryFee(r.deliveryFee ?? "");

        // Priority: API coverPhoto -> per-restaurant localStorage
        const apiCover =
          typeof r.coverPhoto === "string" && r.coverPhoto.length > 6
            ? r.coverPhoto
            : null;
        if (apiCover) {
          setCoverPhoto(apiCover);
        } else if (rid) {
          const lsKey = coverKey(rid);
          const lsCover = localStorage.getItem(lsKey);
          if (lsCover) setCoverPhoto(lsCover);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error(err);
          setError(
            err instanceof Error
              ? err.message
              : "Unknown error while loading profile"
          );
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  /* Keep UI in sync if same restaurant cover changes in another tab */
  useEffect(() => {
    if (!restaurantId) return;
    const lsKey = coverKey(restaurantId);
    function onStorage(e) {
      if (e.key === lsKey) {
        setCoverPhoto(e.newValue || null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [restaurantId]);

  /* Toggle cuisine helper */
  const toggleCuisine = (c) => {
    setCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  /* COVER: choose + preview */
  const onCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setCoverFile(null);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      setCoverPreview(null);
      previewUrlRef.current = null;
      return;
    }
    setCoverFile(f);

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setCoverPreview(url);
  };

  /* COVER: upload to Cloudinary (unsigned) + save per-restaurant in localStorage */
  const handleUploadCover = async () => {
    if (!coverFile) return;
    if (!restaurantId) {
      setError("Restaurant id missing. Reload the page and try again.");
      return;
    }
    if (!CLOUD_UPLOAD_URL || !UPLOAD_PRESET) {
      setError(
        "Missing Cloudinary env: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
      );
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", coverFile);
      fd.append("upload_preset", UPLOAD_PRESET);
      // Optional: fd.append("folder", `restaurants/${restaurantId}/covers`);
      // Optional: fd.append("tags", "restaurant,cover");

      const res = await fetch(CLOUD_UPLOAD_URL, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.secure_url) {
        const msg = data?.error?.message || "Cloudinary upload failed";
        throw new Error(msg);
      }

      // Persist per restaurant
      const lsKey = coverKey(restaurantId); // NEW
      localStorage.setItem(lsKey, data.secure_url); // NEW

      setCoverPhoto(data.secure_url);

      // Cleanup preview
      setCoverFile(null);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setCoverPreview(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Unknown upload error");
    } finally {
      setUploading(false);
    }
  };

  /* Save profile (backend stays the same; we just also keep localStorage) */
  const handleSave = async () => {
    const payload = {
      coverPhoto, // backend may ignore; UI uses localStorage anyway
      name,
      description,
      cuisines,
      minOrder: minOrder === "" ? "" : Number(minOrder),
      deliveryTime: deliveryTime === "" ? "" : Number(deliveryTime),
      deliveryFee: deliveryFee === "" ? "" : Number(deliveryFee),
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to save changes.");
        return;
      }
      setSaving(true);

      const res = await fetch(API_PUT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const parsed = await readJsonSafe(res);
      if (!res.ok) {
        const serverMsg = parsed?.error || parsed?.message || "";
        setError(
          `Save failed (${res.status} ${res.statusText}) ${serverMsg}`.trim()
        );
        return;
      }

      setError(null);
      alert("Changes saved!");
      console.log("Saved:", parsed);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unknown error while saving"
      );
    } finally {
      setSaving(false);
    }
  };

  /* Cleanup preview URL on unmount */
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading profile…</p>;
  }

  const heroBG = coverPreview || coverPhoto; // preview first, otherwise permanent URL

  return (
    <div className="p-6 border bg-white border-white rounded-xl max-w-5xl mx-auto text-gray-800 shadow-lg">
      {/* HERO (background) */}
      <div
        className="relative h-40 sm:h-56 mb-6 rounded-xl border bg-center bg-cover"
        style={heroBG ? { backgroundImage: `url(${heroBG})` } : undefined}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <h2 className="text-2xl font-bold drop-shadow-sm">
            {name || "Restaurant Profile"}
          </h2>
          {/* NEW: small hint which restaurant we are updating */}
          <p className="text-xs opacity-90">
            {restaurantId ? `Restaurant ID: ${restaurantId}` : ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Cover Upload */}
      <div className="mb-6 border rounded-lg p-4">
        <label className="block mb-2 font-semibold">
          Cover Photo (Background)
        </label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={onCoverChange} />
          <button
            type="button"
            onClick={handleUploadCover}
            disabled={!coverFile || uploadingCover || !restaurantId}
            className="px-4 py-2 rounded bg-neutral-800 text-white disabled:opacity-50"
            title={!restaurantId ? "Restaurant id missing" : "Upload cover"}
          >
            {uploadingCover ? "Uploading…" : "Upload Cover to Cloudinary"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Pick a file to preview; click “Upload” to send it to Cloudinary and
          persist it for <strong>this restaurant only</strong>.
        </p>
        {(coverPreview || coverPhoto) && (
          <Image
            width={800}
            height={200}
            src={coverPreview || coverPhoto}
            alt="Cover"
            className="w-full h-40 object-cover border rounded mt-3"
          />
        )}
      </div>

      {/* Restaurant fields */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Restaurant Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Cuisine Types</label>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCuisine(c)}
              className={`px-3 py-1 border rounded ${
                cuisines.includes(c) ? "bg-neutral-700 text-white" : "bg-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="number"
          placeholder="€ Minimum Order"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          type="number"
          placeholder="Delivery Time (min)"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          type="number"
          placeholder="€ Delivery Fee"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          className="border p-2 rounded flex-1"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-orange-500 text-white font-semibold rounded disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>

      {/* Owner info */}
      {owner && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Owner Information</h2>
          <p>
            <span className="font-semibold">Name:</span>{" "}
            {owner.username || owner.name || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {owner.email || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {owner.phone || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {owner.role || "Owner"}
          </p>
        </div>
      )}
    </div>
  );
}
