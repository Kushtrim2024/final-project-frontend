"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  // Auth
  const [token, setToken] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);

  // Profile data
  const [user, setUser] = useState(null);

  // Messages / loading
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Photo upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Default address
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [addrLoading, setAddrLoading] = useState(false);

  // Read token on mount
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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // Fetch profile
  useEffect(() => {
    if (!token) return;
    (async () => {
      setMsg("");
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5517/user/profile", {
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

  // Fetch default address
  useEffect(() => {
    if (!token) return;
    (async () => {
      setAddrLoading(true);
      try {
        const res = await fetch(
          "http://localhost:5517/user/profile/addresses/default",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        if (res.ok) {
          const data = await res.json();
          // backend'ine göre: setDefaultAddress(data.address || data);
          setDefaultAddress(data);
        }
      } finally {
        setAddrLoading(false);
      }
    })();
  }, [token]);

  // Upload / change profile photo
  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploading(true);
    setMsg("");

    const fd = new FormData();
    fd.append("avatar", photoFile);
    fd.append("photo", photoFile);

    let success = false;
    try {
      const res1 = await fetch("http://localhost:5517/user/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res1.ok) {
        const data = await res1.json();
        const newUrl =
          data?.avatarUrl || data?.photoUrl || data?.avatar || data?.photo;
        setUser((u) => ({
          ...u,
          avatarUrl: newUrl ?? u?.avatarUrl,
          photoUrl: newUrl ?? u?.photoUrl,
          photo: newUrl ?? u?.photo,
        }));
        success = true;
        setMsg("Photo updated.");
      }
    } catch {}

    if (!success) {
      try {
        const res2 = await fetch("http://localhost:5517/user/profile/update", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res2.ok) throw new Error(`Upload failed (${res2.status})`);
        const data = await res2.json();
        const newUrl =
          data?.avatarUrl || data?.photoUrl || data?.avatar || data?.photo;
        setUser((u) => ({
          ...u,
          avatarUrl: newUrl ?? u?.avatarUrl,
          photoUrl: newUrl ?? u?.photoUrl,
          photo: newUrl ?? u?.photo,
        }));
        setMsg("Photo updated.");
      } catch (e) {
        setMsg(e.message || "Could not upload photo.");
      }
    }

    setUploading(false);
    setPhotoFile(null);
  };

  // UI states
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
    user?.avatarUrl ||
    user?.photoUrl ||
    user?.avatar ||
    user?.photo ||
    "/avatar.jpg";

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">My Profile</h1>

      {msg && (
        <div className="mb-4 text-sm p-2 rounded bg-gray-100 text-gray-900">
          {msg}
        </div>
      )}

      {/* Photo + uploader */}
      <div className="flex items-start mb-6 flex-col">
        <img
          src={currentPhotoSrc}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/avatar.jpg";
          }}
        />
        <div className="flex flex-col">
          <label className="block text-xs text-gray-700 px-1">
            Change profile photo
          </label>

          <button
            onClick={uploadPhoto}
            disabled={!photoFile || uploading}
            className="mt-1 bg-purple-400 text-sm px-1 py-1 rounded hover:bg-purple-700 disabled:opacity-60 w-30"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </div>
      </div>

      {/* Read-only fields */}
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

      {/* Default address */}
      <div className="mt-8  pt-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">
          Default Address
        </h2>

        {addrLoading ? (
          <p className="text-gray-800 mt-1">Loading address…</p>
        ) : defaultAddress ? (
          <div className="mt-1 mb-3 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
            <p className="font-medium">
              {defaultAddress.title || "My Address"}
            </p>
            <div className="flex gap-2">
              <p>
                {defaultAddress.name && <p>{defaultAddress.name}</p>}
                {defaultAddress.phone && <p>{defaultAddress.phone}</p>}
              </p>
              <p>
                {defaultAddress.line1}
                {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}
              </p>
              <p>
                {defaultAddress.postalCode}, {defaultAddress.city},
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
