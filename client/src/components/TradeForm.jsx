import React, { useState } from "react";
import { ITEM_GROUPS } from "../itemGroups";

const empty = {
  type: "WTS",
  quantity1: "",
  item1: "",
  description1: "",
  quantity2: "",
  item2: "",
  description2: "",
  ingameUser: "",
  discordUser: "",
};

export default function TradeForm({ onCreated, api }) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
    setServerError("");
  };

  const [s1Visible, setS1Visible] = useState(false);
  const [s2Visible, setS2Visible] = useState(false);
  const [s1Groups, setS1Groups] = useState([]);
  const [s2Groups, setS2Groups] = useState([]);

  const filterGroups = (q) => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return ITEM_GROUPS.map((g) => ({
      label: g.label,
      items: g.items.filter((it) => it.toLowerCase().includes(s)),
    })).filter((g) => g.items.length > 0);
  };

  const handleItemInput = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
    setServerError("");
    const groups = filterGroups(value);
    if (name === "item1") {
      setS1Groups(groups);
      setS1Visible(groups.length > 0);
    } else {
      setS2Groups(groups);
      setS2Visible(groups.length > 0);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.quantity1) errs.quantity1 = "Quantity 1 is required";
    if (!form.item1) errs.item1 = "Item 1 is required";
    if (!form.description1 || !form.description1.trim())
      errs.description1 = "Description 1 is required";
    if (!form.quantity2) errs.quantity2 = "Quantity 2 is required";
    if (!form.item2) errs.item2 = "Item 2 is required";
    if (!form.description2 || !form.description2.trim())
      errs.description2 = "Description 2 is required";
    if (!form.ingameUser && !form.discordUser)
      errs.contact =
        "Provide at least an in-game username or a Discord username";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${api}/trades`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated && onCreated(data);
        setForm(empty);
        setErrors({});
      } else {
        setServerError(data.error || "Failed");
      }
    } catch (err) {
      console.error(err);
      setServerError("Network error");
    }
    setLoading(false);
  };

  const hasFormError = Object.keys(errors).length > 0 || !!serverError;

  return (
    <form
      onSubmit={submit}
      className={`p-4 rounded shadow mb-6 ${
        hasFormError ? "border border-red-300 bg-red-50" : "bg-white"
      }`}
    >
      {serverError && (
        <div className="mb-2 text-sm text-red-700">{serverError}</div>
      )}

      {/* compact grouped suggestion dropdowns (replaces datalist for better UX) */}
      {/* Type selector */}
      <label className="flex flex-col mb-3">
        <span className="text-sm font-medium">Type</span>
        <select
          name="type"
          value={form.type}
          onChange={handle}
          className="mt-1 p-2 border rounded"
        >
          <option>WTS</option>
          <option>WTB</option>
          <option>WTT</option>
        </select>
      </label>

      {/* Two-column layout for have/want */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">I have</span>
          <div className="mt-1">
            <div className="relative">
              <input
                name="item1"
                value={form.item1}
                onChange={(e) => handleItemInput("item1", e.target.value)}
                placeholder="Category"
                className={`w-full p-2 border rounded ${
                  errors.item1 ? "border-red-500" : ""
                }`}
                onFocus={() => {
                  const groups = filterGroups(form.item1);
                  setS1Groups(groups);
                  setS1Visible(groups.length > 0);
                }}
                onBlur={() => setTimeout(() => setS1Visible(false), 120)}
              />
              {errors.item1 && (
                <span
                  title={errors.item1}
                  className="absolute right-2 top-2 text-red-600"
                >
                  ❗
                </span>
              )}
              {s1Visible && s1Groups.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-50 max-h-40 overflow-auto text-sm">
                  {s1Groups.map((g) => (
                    <div key={g.label} className="p-1">
                      <div className="text-xs uppercase text-gray-500 px-1">
                        {g.label}
                      </div>
                      {g.items.map((it) => (
                        <div
                          key={it}
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setForm((f) => ({ ...f, item1: it }));
                            setS1Visible(false);
                          }}
                          className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        >
                          {it}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <label className="flex flex-col mt-2 relative">
            <span className="text-sm text-gray-700">Description</span>
            <textarea
              name="description1"
              value={form.description1}
              onChange={handle}
              placeholder="Details about the item"
              className={`mt-1 p-2 border rounded text-sm min-h-[56px] ${
                errors.description1 ? "border-red-500" : ""
              }`}
            />
            {errors.description1 && (
              <span
                title={errors.description1}
                className="absolute right-2 top-6 text-red-600"
              >
                ❗
              </span>
            )}
          </label>
          <div className="mt-2">
            Quantity:
            <div className="relative w-28">
              <input
                name="quantity1"
                value={form.quantity1}
                onChange={handle}
                placeholder="Qty"
                className={`w-full p-2 border rounded ${
                  errors.quantity1 ? "border-red-500" : ""
                }`}
              />
              {errors.quantity1 && (
                <span
                  title={errors.quantity1}
                  className="absolute right-2 top-2 text-red-600"
                >
                  ❗
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium">I want</span>
          <div className="mt-1">
            <div className="relative">
              <input
                name="item2"
                value={form.item2}
                onChange={(e) => handleItemInput("item2", e.target.value)}
                placeholder="Category"
                className={`w-full p-2 border rounded ${
                  errors.item2 ? "border-red-500" : ""
                }`}
                onFocus={() => {
                  const groups = filterGroups(form.item2);
                  setS2Groups(groups);
                  setS2Visible(groups.length > 0);
                }}
                onBlur={() => setTimeout(() => setS2Visible(false), 120)}
              />
              {errors.item2 && (
                <span
                  title={errors.item2}
                  className="absolute right-2 top-2 text-red-600"
                >
                  ❗
                </span>
              )}
              {s2Visible && s2Groups.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-50 max-h-40 overflow-auto text-sm">
                  {s2Groups.map((g) => (
                    <div key={g.label} className="p-1">
                      <div className="text-xs uppercase text-gray-500 px-1">
                        {g.label}
                      </div>
                      {g.items.map((it) => (
                        <div
                          key={it}
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setForm((f) => ({ ...f, item2: it }));
                            setS2Visible(false);
                          }}
                          className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        >
                          {it}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <label className="flex flex-col mt-2 relative">
            <span className="text-sm text-gray-700">Description</span>
            <textarea
              name="description2"
              value={form.description2}
              onChange={handle}
              placeholder="Details about the item"
              className={`mt-1 p-2 border rounded text-sm min-h-[56px] ${
                errors.description2 ? "border-red-500" : ""
              }`}
            />
            {errors.description2 && (
              <span
                title={errors.description2}
                className="absolute right-2 top-6 text-red-600"
              >
                ❗
              </span>
            )}
          </label>
          <div className="mt-2">
            Quantity:
            <div className="relative w-28">
              <input
                name="quantity2"
                value={form.quantity2}
                onChange={handle}
                placeholder="Qty"
                className={`w-full p-2 border rounded ${
                  errors.quantity2 ? "border-red-500" : ""
                }`}
              />
              {errors.quantity2 && (
                <span
                  title={errors.quantity2}
                  className="absolute right-2 top-2 text-red-600"
                >
                  ❗
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <label className="flex flex-col relative">
          <span className="text-sm font-medium">In-game username</span>
          <input
            name="ingameUser"
            value={form.ingameUser}
            onChange={handle}
            className={`mt-1 p-2 border rounded ${
              errors.contact ? "border-red-500" : ""
            }`}
          />
          {errors.contact && (
            <span
              title={errors.contact}
              className="absolute right-2 top-6 text-red-600"
            >
              ❗
            </span>
          )}
        </label>
        <label className="flex flex-col relative">
          <span className="text-sm font-medium">Discord</span>
          <input
            name="discordUser"
            value={form.discordUser}
            onChange={handle}
            className={`mt-1 p-2 border rounded ${
              errors.contact ? "border-red-500" : ""
            }`}
          />
          {errors.contact && (
            <span
              title={errors.contact}
              className="absolute right-2 top-6 text-red-600"
            >
              ❗
            </span>
          )}
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Posting..." : "Post Trade"}
        </button>
      </div>
    </form>
  );
}
