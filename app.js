const API_URL = window.APP_CONFIG?.GAS_WEB_APP_URL || "";
const GROUP_ID = new URLSearchParams(location.search).get("group") || "demo";
const GROUP_TITLE = new URLSearchParams(location.search).get("title") || "午餐團";
const USE_REMOTE = API_URL.startsWith("https://");
const ALL = "全部";
const DEFAULT_OPTION = "正常";

const state = {
  locked: false,
  activeCategory: ALL,
  menu: [
    { id: "m1", name: "雞腿飯", price: 120, category: "便當" },
    { id: "m2", name: "排骨飯", price: 110, category: "便當" },
    { id: "m3", name: "滷肉飯", price: 75, category: "飯類" },
    { id: "m4", name: "牛肉麵", price: 145, category: "麵類" },
    { id: "m5", name: "燙青菜", price: 45, category: "小菜" },
    { id: "m6", name: "紅茶", price: 30, category: "飲料" },
    { id: "m7", name: "珍珠奶茶", price: 65, category: "飲料" }
  ],
  draft: {},
  orders: [
    {
      id: "o1",
      person: "1號",
      note: "不要香菜",
      items: [
        { menuId: "m1", name: "雞腿飯", price: 120, qty: 1, option: "正常", note: "飯少" },
        { menuId: "m6", name: "紅茶", price: 30, qty: 1, option: "少冰", note: "" }
      ]
    },
    {
      id: "o2",
      person: "小美",
      note: "一起付現",
      items: [
        { menuId: "m3", name: "滷肉飯", price: 75, qty: 1, option: "正常", note: "不要香菜" },
        { menuId: "m5", name: "燙青菜", price: 45, qty: 1, option: "正常", note: "" }
      ]
    }
  ]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const money = (value) => `$${Number(value || 0).toLocaleString("zh-TW")}`;

function uid(prefix) {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    window.prompt("複製這段文字", text);
    showToast("已產生文字，可手動複製");
  }
}

function callApi(action, payload = {}) {
  if (!USE_REMOTE) return Promise.resolve({ ok: true, local: true });

  const params = new URLSearchParams({
    action,
    payload: JSON.stringify(payload),
    callback: `gasCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`
  });

  return new Promise((resolve, reject) => {
    const callbackName = params.get("callback");
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("GAS 回應逾時"));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (result) => {
      cleanup();
      if (result?.ok) resolve(result);
      else reject(new Error(result?.message || "GAS 呼叫失敗"));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("無法連線到 GAS"));
