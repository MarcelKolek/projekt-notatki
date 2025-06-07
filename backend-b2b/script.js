const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
const LOG_FILE = path.join(LOG_DIR, "logs.txt");

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REALM = process.env.REALM;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const API_URL = process.env.API_URL;
const PORT = process.env.PORT; 

async function tryGetAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);

  const res = await axios.post(
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
    params
  );
  return res.data.access_token;
}

async function getAccessTokenWithRetry() {
  while (true) {
    try {
      const token = await tryGetAccessToken();
      log(`[INFO] Token otrzymany z Keycloak.`);
      return token;
    } catch (err) {
      const msg = err.response?.data || err.code || err.message || err;
      log(`[ERROR] Błąd przy pobieraniu tokena: ${JSON.stringify(msg)}`);
      log("Ponawiam próbę za 5 sekund…");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function fetchAllNotes() {
  const token = await getAccessTokenWithRetry();
  try {
    const res = await axios.get(`${API_URL}/notes/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { count }= res.data;
    log(`[INFO] Liczba notatek w bazie: ${count}`);
  } catch (err) {
    const msg = err.response?.data || err.code || err.message || err;
    log(`[ERROR] Błąd przy pobieraniu notatek z API: ${JSON.stringify(msg)}`);
  }
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage, "utf8");
  console.log(logMessage.trim());
}

const app = express();

app.get("/health", (req, res) => {
  res.send({ status: "ok" });
});

app.post("/run-now", async (req, res) => {
  log("🔁 Manualne uruchomienie fetchAllNotes przez /run-now");
  await fetchAllNotes();
  res.send({ status: "started" });
});

app.listen(PORT, () => {
  log(`[INFO] Serwer uruchomiony na porcie ${PORT}`);
});

cron.schedule("*/3 * * * *", () => {
  fetchAllNotes();
});

fetchAllNotes();