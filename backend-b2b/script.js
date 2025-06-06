const axios = require("axios");
const cron = require("node-cron");

const KEYCLOAK_URL = process.env.KEYCLOAK_URL; // e.g. http://keycloak:8080/auth
const REALM = process.env.REALM;               // e.g. notes-realm
const CLIENT_ID = process.env.CLIENT_ID;       // e.g. notes-backend
const CLIENT_SECRET = process.env.CLIENT_SECRET; // e.g. another_secret_here
const API_URL = process.env.API_URL;           // e.g. http://backend:8000

/**
 * Try once to fetch an access token from Keycloak.
 * If Keycloak isn’t ready yet (ECONNREFUSED or any other error), this throws.
 */
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

/**
 * Repeatedly calls tryGetAccessToken() until it succeeds.
 * On failure, logs the error and waits 5 seconds before retrying.
 */
async function getAccessTokenWithRetry() {
  while (true) {
    try {
      const token = await tryGetAccessToken();
      console.log(`[${new Date().toISOString()}] Otrzymano token z Keycloak.`);
      return token;
    } catch (err) {
      const msg = err.response?.data || err.code || err.message || err;
      console.error(
        `[${new Date().toISOString()}] Błąd przy pobieraniu tokena:`,
        msg
      );
      console.log("Ponawiam próbę za 5 sekund…");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // loop again
    }
  }
}

/**
 * Fetch all notes from the API. First obtains a valid token (waiting as long as needed).
 */
async function fetchAllNotes() {
  const token = await getAccessTokenWithRetry();
  try {
    const res = await axios.get(`${API_URL}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notes = res.data;
    console.log(
      `[${new Date().toISOString()}] Liczba notatek: ${notes.length}`
    );
  } catch (err) {
    const msg = err.response?.data || err.code || err.message || err;
    console.error(`[${new Date().toISOString()}] Błąd przy pobieraniu notatek:`, msg);
  }
}

// Uruchom co godzinę: minuta 0 każdej godziny
cron.schedule("0 * * * *", () => {
  console.log(`[${new Date().toISOString()}] Uruchamiam zadanie pobrania notatek…`);
  fetchAllNotes();
});

// Dla testu (natychmiastowe uruchomienie raz na starcie)
fetchAllNotes();
