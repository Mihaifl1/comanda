// Configurare backend (server propriu pe Raspberry Pi, prin tunel HTTPS).
// Dupa ce pornim tunelul Cloudflare, inlocuieste doar valoarea de mai jos.
const BASE = "https://excerpt-zip-eastern-classifieds.trycloudflare.com/comanda";

const API_BASE = BASE + "/api";
const FILES_BASE = BASE + "/files";

function authToken() {
  try { return localStorage.getItem("comanda_token") || ""; } catch (e) { return ""; }
}
function setToken(t) {
  try { localStorage.setItem("comanda_token", t); } catch (e) {}
}
function clearToken() {
  try { localStorage.removeItem("comanda_token"); } catch (e) {}
}
function requireAuth() {
  if (!authToken()) window.location.href = "index.html";
}
function fileUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return FILES_BASE + "/" + path;
}
