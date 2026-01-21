import React, { useState } from "react";
import { ITEM_GROUPS } from "../itemGroups";
import {
  Ammo,
  Consumables_Aid,
  Consumables_Drink,
  Consumables_Misc,
  Mods as ItemMods,
  FurniturePlans,
  Blueprints,
  Caps,
  Leaders,
  Fuel,
} from "../itemNames";

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
  const [showErrors, setShowErrors] = useState(false);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
    setServerError("");
    if (name === "item1") {
      setForm((f) => ({ ...f, description1: "", item1: value }));
      setSearch1Results([]);
      setSearch1Visible(false);
    }
    if (name === "item2") {
      setForm((f) => ({ ...f, description2: "", item2: value }));
      setSearch2Results([]);
      setSearch2Visible(false);
    }
  };

  const [s1Visible, setS1Visible] = useState(false);
  const [s2Visible, setS2Visible] = useState(false);
  const [s1Groups, setS1Groups] = useState([]);
  const [s2Groups, setS2Groups] = useState([]);
  const [search1Results, setSearch1Results] = useState([]);
  const [search1Visible, setSearch1Visible] = useState(false);
  const [description1Selected, setDescription1Selected] = useState(false);
  const [search2Results, setSearch2Results] = useState([]);
  const [search2Visible, setSearch2Visible] = useState(false);
  const [description2Selected, setDescription2Selected] = useState(false);

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

  const getItemsForCategory = (category) => {
    if (!category) return [];
    const cat = category.trim();
    if (cat === "Ammo") return Ammo;
    if (cat === "Currencies") return Caps.concat(Leaders).concat(Fuel);
    if (cat === "Aid") return Consumables_Aid;
    if (cat === "Drink" || cat === "Food") return Consumables_Drink;
    if (cat === "Misc") return Consumables_Misc;
    if (cat === "Blueprints" || cat === "Recipes") return Blueprints;
    if (cat === "Weapon Plan" || cat === "Armor Plan") return FurniturePlans;
    // flatten mods
    if (cat.includes("mod") || cat === "Weapon Mod" || cat === "Armor Mod") {
      const w = ItemMods.weapon || {};
      const a = ItemMods.armor || {};
      const vals = [];
      Object.values(w).forEach((arr) => vals.push(...(arr || [])));
      Object.values(a).forEach((arr) => vals.push(...(arr || [])));
      return vals;
    }
    return [];
  };

  const handleDescription1Search = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, description1: v }));
    setErrors((e) => ({ ...e, description1: "" }));
    setServerError("");
    setDescription1Selected(false);

    // only search within selected category
    const items = getItemsForCategory(form.item1);
    if (!items || items.length === 0 || !v.trim()) {
      setSearch1Results([]);
      setSearch1Visible(false);
      return;
    }
    const q = v.trim().toLowerCase();
    const results = items.filter((it) => it.toLowerCase().includes(q));
    setSearch1Results(results.slice(0, 50));
    setSearch1Visible(results.length > 0);
  };

  const handleDescription2Search = (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, description2: v }));
    setErrors((e) => ({ ...e, description2: "" }));
    setServerError("");
    setDescription2Selected(false);

    const items = getItemsForCategory(form.item2);
    if (!items || items.length === 0 || !v.trim()) {
      setSearch2Results([]);
      setSearch2Visible(false);
      return;
    }
    const q = v.trim().toLowerCase();
    const results = items.filter((it) => it.toLowerCase().includes(q));
    setSearch2Results(results.slice(0, 50));
    setSearch2Visible(results.length > 0);
  };

  const validate = () => {
    const errs = {};
    if (!form.quantity1) errs.quantity1 = "Quantity 1 is required";
    if (!form.item1) errs.item1 = "Item 1 is required";
    // description1 must be one of the items for the selected category
    const validItems1 = getItemsForCategory(form.item1) || [];
    if (!form.description1 || !validItems1.includes(form.description1))
      errs.description1 = "Choose a valid description from the list";
    // description2 must be one of the items for the selected category
    const validItems2 = getItemsForCategory(form.item2) || [];
    if (!form.description2 || !validItems2.includes(form.description2))
      errs.description2 = "Choose a valid description from the list";
    if (!form.quantity2) errs.quantity2 = "Quantity 2 is required";
    if (!form.item2) errs.item2 = "Item 2 is required";
    if (!form.ingameUser && !form.discordUser)
      errs.contact =
        "Provide at least an in-game username or a Discord username";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerError("");
    setShowErrors(true);

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
        setShowErrors(false);
      } else {
        setServerError(data.error || "Failed");
      }
    } catch (err) {
      console.error(err);
      setServerError("Network error");
    }
    setLoading(false);
  };

  const hasFormError =
    (showErrors && Object.keys(errors).length > 0) || !!serverError;

  return (
    <form
      onSubmit={submit}
      className={`p-4 rounded shadow mb-6 ${hasFormError ? "app-card" : "app-card"}`}
    >
      {serverError && (
        <div className="mb-2 text-sm text-red-700">{serverError}</div>
      )}

      {/* compact grouped suggestion dropdowns (replaces datalist for better UX) */}
      {/* Type selector */}
      <label className="flex flex-col mb-3">
        <span className="text-sm font-medium text-primary">Type</span>
        <select
          name="type"
          value={form.type}
          onChange={handle}
          className="mt-1 p-2 rounded [#1f1e1d] text-[#c7974b] border border-[#c7974b]/40"
        >
          <option>WTS</option>
          <option>WTB</option>
          <option>WTT</option>
        </select>
      </label>

      {/* Two-column layout for have/want */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-primary">I have</span>
          <div className="mt-1">
            <div className="relative">
              <select
                name="item1"
                value={form.item1}
                onChange={handle}
                placeholder="Category"
                className={`w-full p-2 rounded [#1f1e1d] text-[#c7974b] border ${
                  showErrors && errors.item1
                    ? "border-red-500 border-4"
                    : "border-[#c7974b]/40"
                }`}
              >
                <option value="">Select category</option>
                {ITEM_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((it) => (
                      <option key={it} value={it}>
                        {it}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {showErrors && errors.item1 && (
                <span
                  title={errors.item1}
                  className="absolute right-3 top-2 text-red-600"
                >
                  ❗
                </span>
              )}
              {s1Visible && s1Groups.length > 0 && (
                <div className="absolute left-0 right-0 mt-1white border rounded shadow z-50 max-h-40 overflow-auto text-sm">
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
            <span className="text-sm text-primary">Description</span>
            <input
              name="description1"
              value={form.description1}
              onChange={handleDescription1Search}
              placeholder={
                form.item1
                  ? `Search ${form.item1}...`
                  : "Select a category first"
              }
              className={`mt-1 p-2 rounded text-sm[#1f1e1d] text-[#c7974b] border ${
                showErrors && errors.description1
                  ? "border-red-500 border-4"
                  : "border-[#c7974b]/40"
              }`}
            />
            {search1Visible && (
              <div className="absolute left-0 right-0 mt-1 bg-orange-200 border rounded shadow z-50 max-h-44 overflow-auto text-sm">
                {search1Results.map((it) => (
                  <div
                    key={it}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setForm((f) => ({ ...f, description1: it }));
                      setDescription1Selected(true);
                      setSearch1Visible(false);
                    }}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  >
                    {it}
                  </div>
                ))}
              </div>
            )}
            {showErrors && errors.description1 && (
              <span
                title={errors.description1}
                className="absolute right-3 top-10 text-red-600"
              >
                ❗
              </span>
            )}
          </label>
          <div className="mt-2">
            Quantity:
            <div className="relative w-28">
              <input
                type="number"
                name="quantity1"
                value={form.quantity1}
                onChange={handle}
                placeholder="Qty"
                className={`w-full p-2 rounded[#1f1e1d] text-[#c7974b] border ${
                  showErrors && errors.quantity1
                    ? "border-red-500 border-4"
                    : "border-[#c7974b]/40"
                }`}
              />
              {showErrors && errors.quantity1 && (
                <span
                  title={errors.quantity1}
                  className="absolute right-3 top-2 text-red-600"
                >
                  ❗
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-primary">I want</span>
          <div className="mt-1">
            <div className="relative">
              <select
                name="item2"
                value={form.item2}
                onChange={handle}
                placeholder="Category"
                className={`w-full p-2 rounded[#1f1e1d] text-[#c7974b] border ${
                  showErrors && errors.item2
                    ? "border-red-500 border-4"
                    : "border-[#c7974b]/40"
                }`}
              >
                <option value="">Select category</option>
                {ITEM_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((it) => (
                      <option key={it} value={it}>
                        {it}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {showErrors && errors.item2 && (
                <span
                  title={errors.item2}
                  className="absolute right-3 top-2 text-red-600"
                >
                  ❗
                </span>
              )}
              {s2Visible && s2Groups.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 border rounded shadow z-50 max-h-40 overflow-auto text-sm">
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
            <span className="text-sm text-primary">Description</span>
            <input
              name="description2"
              value={form.description2}
              onChange={handleDescription2Search}
              placeholder={
                form.item2
                  ? `Search ${form.item2}...`
                  : "Select a category first"
              }
              className={`mt-1 p-2 rounded text-sm[#1f1e1d] text-[#c7974b] border ${
                showErrors && errors.description2
                  ? "border-red-500 border-4"
                  : "border-[#c7974b]/40"
              }`}
            />
            {search2Visible && (
              <div className="absolute left-0 right-0 mt-1 bg-orange-200 white border rounded shadow z-50 max-h-44 overflow-auto text-sm">
                {search2Results.map((it) => (
                  <div
                    key={it}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      setForm((f) => ({ ...f, description2: it }));
                      setDescription2Selected(true);
                      setSearch2Visible(false);
                    }}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  >
                    {it}
                  </div>
                ))}
              </div>
            )}
            {showErrors && errors.description2 && (
              <span
                title={errors.description2}
                className="absolute right-3 top-10 text-red-600"
              >
                ❗
              </span>
            )}
          </label>
          <div className="mt-2">
            Quantity:
            <div className="relative w-28">
              <input
                type="number"
                name="quantity2"
                value={form.quantity2}
                onChange={handle}
                placeholder="Qty"
                className={`w-full p-2 rounded[#1f1e1d] text-[#c7974b] border ${
                  showErrors && errors.quantity2
                    ? "border-red-500 border-4"
                    : "border-[#c7974b]/40"
                }`}
              />
              {showErrors && errors.quantity2 && (
                <span
                  title={errors.quantity2}
                  className="absolute right-3 top-2 text-red-600"
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
          <span className="text-sm font-medium text-primary">
            In-game username
          </span>
          <input
            name="ingameUser"
            value={form.ingameUser}
            onChange={handle}
            className={`mt-1 p-2 rounded [#1f1e1d] text-[#c7974b] border ${
              showErrors && errors.contact
                ? "border-red-500 border-4"
                : "border-[#c7974b]/40"
            }`}
          />
          {showErrors && errors.contact && (
            <span
              title={errors.contact}
              className="absolute right-3 top-8 text-red-600"
            >
              ❗
            </span>
          )}
        </label>
        <label className="flex flex-col relative">
          <span className="text-sm font-medium text-primary">Discord</span>
          <input
            name="discordUser"
            value={form.discordUser}
            onChange={handle}
            className={`mt-1 p-2 rounded [#1f1e1d] text-[#c7974b] border ${
              showErrors && errors.contact
                ? "border-red-500 border-4"
                : "border-[#c7974b]/40"
            }`}
          />
          {showErrors && errors.contact && (
            <span
              title={errors.contact}
              className="absolute right-3 top-8 text-red-600"
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
          className="px-4 py-2 rounded disabled:opacity-50 bg-[#c7974b] text-[#2b2a29]"
        >
          {loading ? "Posting..." : "Post Trade"}
        </button>
      </div>
    </form>
  );
}
