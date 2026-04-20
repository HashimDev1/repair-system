import React, { useEffect, useState } from "react";
import { api, fullImageUrl } from "../../lib/api";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/AuthContext";

export default function VendorProfile() {
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [me, setMe] = useState(null);

  const [form, setForm] = useState({ phone: "", city_area: "" });

  const [profileFile, setProfileFile] = useState(null);
  const [shopFile, setShopFile] = useState(null);

  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ service_type: "", base_price: "" });

  async function loadAll() {
    setLoading(true);
    setError("");
    setMsg("");

    try {
      const v = await api.get(`/vendors/${userId}`);
      setMe(v.data);

      setForm({
        phone: v.data?.phone || "",
        city_area: v.data?.city_area || "",
      });

      const s = await api.get("/vendors/me/services");
      setServices(s.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load vendor profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) loadAll();
  }, [userId]);

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setSaving(true);

    try {
      const res = await api.put("/vendors/me", {
        phone: form.phone || null,
        city_area: form.city_area || null,
      });
      setMe(res.data);
      setMsg("Profile updated.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(kind) {
    setError("");
    setMsg("");

    try {
      const file = kind === "profile" ? profileFile : shopFile;
      if (!file) {
        setError("Please select an image file first.");
        return;
      }

      const fd = new FormData();
      fd.append("file", file);

      const endpoint =
        kind === "profile"
          ? "/vendors/me/upload/profile-image"
          : "/vendors/me/upload/shop-image";

      const res = await api.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMe(res.data);
      setMsg(kind === "profile" ? "Profile image uploaded." : "Shop image uploaded.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed.");
    }
  }

  async function addService(e) {
    e.preventDefault();
    setError("");
    setMsg("");

    try {
      const payload = {
        service_type: newService.service_type.trim(),
        base_price: newService.base_price ? Number(newService.base_price) : null,
      };

      const res = await api.post("/vendors/me/services", payload);
      setServices((p) => [res.data, ...p]);
      setNewService({ service_type: "", base_price: "" });
      setMsg("Service added.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Add service failed.");
    }
  }

  async function deleteService(serviceId) {
    if (!confirm("Delete this service?")) return;

    setError("");
    setMsg("");

    try {
      await api.delete(`/vendors/me/services/${serviceId}`);
      setServices((p) => p.filter((x) => x.id !== serviceId));
      setMsg("Service deleted.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Delete failed.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl">
        <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-slate-200">
          Vendor Dashboard
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Vendor Profile</h1>
        <p className="mt-3 text-sm md:text-base text-slate-300 leading-7">
          Manage your business profile, upload shop and profile images, and list
          the services customers can hire you for.
        </p>
      </section>

      {me && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Vendor Name</div>
            <div className="mt-2 text-xl font-bold text-slate-900">{me.name || "—"}</div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Phone</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {me.phone || "Not added"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">City / Area</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {me.city_area || "Not added"}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
        {loading && <Spinner label="Loading profile..." />}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {msg && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {msg}
          </div>
        )}

        {!loading && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Business Details</h2>
              <p className="mt-2 text-sm text-slate-500">
                Keep your profile updated so customers can trust your service.
              </p>
            </div>

            <form onSubmit={saveProfile} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Phone Number
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 03xx-xxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  City / Area
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  value={form.city_area}
                  onChange={(e) => setForm((p) => ({ ...p, city_area: e.target.value }))}
                  placeholder="e.g. Gulshan, Johar, DHA"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  disabled={saving}
                  className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="text-lg font-bold text-slate-900">Profile Image</div>
                <p className="mt-1 text-sm text-slate-500">
                  This image helps customers recognize you as a vendor.
                </p>

                <input
                  className="mt-4 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileFile((e.target.files || [])[0] || null)}
                />

                <button
                  onClick={() => uploadImage("profile")}
                  className="mt-4 inline-flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
                >
                  Upload Profile Image
                </button>

                {me?.profile_image_url && (
                  <a
                    href={fullImageUrl(me.profile_image_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <img
                      className="mt-4 h-32 w-32 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm"
                      src={fullImageUrl(me.profile_image_url)}
                      alt="profile"
                    />
                  </a>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="text-lg font-bold text-slate-900">Shop Image</div>
                <p className="mt-1 text-sm text-slate-500">
                  Show your workplace or repair shop to build confidence.
                </p>

                <input
                  className="mt-4 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setShopFile((e.target.files || [])[0] || null)}
                />

                <button
                  onClick={() => uploadImage("shop")}
                  className="mt-4 inline-flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
                >
                  Upload Shop Image
                </button>

                {me?.shop_image_url && (
                  <a
                    href={fullImageUrl(me.shop_image_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <img
                      className="mt-4 h-32 w-32 rounded-2xl object-cover border border-slate-200 bg-white shadow-sm"
                      src={fullImageUrl(me.shop_image_url)}
                      alt="shop"
                    />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Services</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Add the repair services you provide so customers know what you specialize in.
                </p>
              </div>

              <form onSubmit={addService} className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Service Type
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    value={newService.service_type}
                    onChange={(e) =>
                      setNewService((p) => ({ ...p, service_type: e.target.value }))
                    }
                    placeholder="e.g. Mobile Repair"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Base Price <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    type="number"
                    min="0"
                    value={newService.base_price}
                    onChange={(e) =>
                      setNewService((p) => ({ ...p, base_price: e.target.value }))
                    }
                    placeholder="e.g. 500"
                  />
                </div>

                <div className="flex items-end">
                  <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800">
                    Add Service
                  </button>
                </div>
              </form>

              {services.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-5 text-sm text-slate-600">
                  No services added yet.
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {services.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="text-base font-semibold text-slate-900">
                          {s.service_type}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Base price: {s.base_price != null ? `PKR ${s.base_price}` : "—"}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteService(s.id)}
                        className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm text-slate-600">
              After upload, customers will see your profile and shop images during vendor selection.
            </div>
          </>
        )}
      </section>
    </div>
  );
}