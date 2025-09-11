"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5517";

export default function ProfilePage() {
  const [token, setToken] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);

  const [user, setUser] = useState(null);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [defaultAddress, setDefaultAddress] = useState(null);
  const [addrLoading, setAddrLoading] = useState(false);

  useEffect(() => {
    const t =
      (typeof window !== "undefined" &&
        (localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token"))) ||
      null;
    setToken(t);
    setTokenReady(true);
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setMsg("");
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/user/profile`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Load error (${res.status})`);
        const data = await res.json();
        setUser(data);
      } catch (e) {
        setMsg(e.message || "Could not load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setAddrLoading(true);
      try {
        const res = await fetch(`${API_BASE}/user/profile/addresses/default`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setDefaultAddress(data);
        }
      } finally {
        setAddrLoading(false);
      }
    })();
  }, [token]);

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploading(true);
    setMsg("");

    const fd = new FormData();
    fd.append("avatar", photoFile); // ✅ backend fields: avatar/photo

    try {
      const res = await fetch(`${API_BASE}/user/profile/photo`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setUser((u) => ({ ...u, profilePicture: data.url }));
      setMsg("✅ The photo has been updated.");
    } catch (e) {
      setMsg(e.message || "The photo could not be uploaded.");
    } finally {
      setUploading(false);
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
    }
  };

  if (!tokenReady) {
    return (
      <p className="mt-10 text-center text-gray-900 dark:text-white font-medium">
        Preparing…
      </p>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 rounded-xl shadow bg-white">
        <p className="text-lg font-semibold text-gray-900">Login required</p>
        <p className="mt-2 text-gray-800">Please sign in to continue.</p>
        <a
          href="/login"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Go to login
        </a>
      </div>
    );
  }

  if (!user || loading) {
    return (
      <p className="mt-10 text-center text-gray-900 dark:text-white font-medium">
        Loading…
      </p>
    );
  }

  const currentPhotoSrc =
    photoPreview ||
    user?.profilePicture ||
    user?.avatarUrl ||
    user?.photoUrl ||
    "/avatar.jpg";

  return (
    <div className="max-w-lg mx-auto mt-10 shadow rounded-lg p-6 bg-white/80">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">My Profile</h1>

      {msg && (
        <div className="mb-4 text-sm p-2 rounded bg-gray-100 text-gray-900">
          {msg}
        </div>
      )}

      <div className="flex items-start mb-6 flex-col gap-3">
        <img
          src={currentPhotoSrc}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border"
          onError={(e) => {
            e.currentTarget.src = "/avatar.jpg";
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const f = e.target.files[0];
              setPhotoFile(f);
              if (photoPreview) URL.revokeObjectURL(photoPreview);
              setPhotoPreview(URL.createObjectURL(f));
            }
          }}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            Select New Photo
          </button>

          {photoFile && (
            <button
              onClick={uploadPhoto}
              disabled={uploading}
              className="bg-purple-600 text-white text-sm px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <p className="mt-1 mb-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
            {user?.name || "-"}
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <p className="mt-1 mb-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
            {user?.email || "-"}
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-700">Phone</label>
          <p className="mt-1 mb-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
            {user?.phone || "-"}
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">
          My Default Address
        </h2>

        {addrLoading ? (
          <p className="text-gray-800 mt-1">Loading address…</p>
        ) : defaultAddress ? (
          <div className="mt-1 mb-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
            <p className="font-medium">{defaultAddress.title}</p>
            <div className="flex text-sm text-gray-700">
              {defaultAddress.name && <p>{defaultAddress.name}</p>}
              {defaultAddress.phone && <p>{defaultAddress.phone}</p>}
              <p>
                {defaultAddress.street} -
                {defaultAddress.street2 ? `, ${defaultAddress.street2}` : ""}
              </p>
              <p>
                {defaultAddress.postalCode} - {defaultAddress.city}
                {defaultAddress.state ? `, ${defaultAddress.state}` : ""}
              </p>
              <p>{defaultAddress.country}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 mt-1">No default address.</p>
        )}
      </div>
    </div>
  );
}
