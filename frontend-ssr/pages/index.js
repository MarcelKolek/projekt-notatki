import React from "react";
import axios from "axios";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

// Adresy z env
const KEYCLOAK_URL = process.env.KEYCLOAK_URL; // http://keycloak:8080/auth
const REALM = process.env.REALM; // notes-realm
const CLIENT_ID = process.env.CLIENT_ID; // notes-ssr
const CLIENT_SECRET = process.env.CLIENT_SECRET; // change_this_sooner
const API_URL = process.env.API_URL; // http://backend:8000

export default function Home({ notes, userInfo }) {
  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Witaj, {userInfo.preferred_username}</h1>
      <h2>Ostatnie 5 notatek</h2>
      {notes.length === 0 ? (
        <div>Brak notatek</div>
      ) : (
        <ul>
          {notes.map((n) => (
            <li key={n.id}>
              <strong>{n.title}</strong> – właściciel: {n.owner_id}
              <p>{n.content.substring(0, 100)}…</p>
              <a href={`/notes/${n.id}`}>Zobacz szczegóły</a>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => (window.location.href = "/logout")}>
        Wyloguj
      </button>
    </div>
  );
}

export async function getServerSideProps({ req, res, query }) {
  // 1. Sprawdź cookie "kc_token"
  const cookies = parse(req.headers.cookie || "");
  let token = cookies["kc_token"];

  // 2. Jeśli nie ma tokenu lub mamy ?code=..., wymień kod na token
  if (!token && query.code) {
    // Wymiana code na token
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", query.code);
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append(
      "redirect_uri",
      `http://${req.headers.host}` // np. http://localhost:3001
    );

    const tokenRes = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      params
    );
    token = tokenRes.data.access_token;
    // Ustaw cookie (httpOnly, secure = false w dev)
    res.setHeader("Set-Cookie", `kc_token=${token}; HttpOnly; Path=/`);
  }

  // 3. Jeśli dalej nie ma tokenu, przekieruj do Keycloak login
  if (!token) {
    const redirectUri = encodeURIComponent(
      `http://${req.headers.host}` // po zalogowaniu wróci tu
    );
    return {
      redirect: {
        destination: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}`,
        permanent: false,
      },
    };
  }

  // 4. Zweryfikuj token (możemy jedynie odszyfrować payload bez weryfikacji signature,
  //    by wyciągnąć userInfo; do prawdziwej produkcji warto pobrać JWKS i zweryfikować)
  const decoded = jwt.decode(token);
  const userInfo = {
    preferred_username: decoded.preferred_username || decoded.sub,
    roles: decoded.realm_access ? decoded.realm_access.roles : [],
  };

  // 5. Pobierz wszystkie notatki, a potem wybierz ostatnie 5 (jeśli ADMIN – wszystkie, jeśli USER – tylko własne)
  const notesRes = await axios.get(`${API_URL}/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let notes = notesRes.data;
  // posortuj po id lub stwórz pole timestamp przy tworzeniu notatki, ale po prostu weź ostatnie 5
  notes = notes.slice(-5).reverse();

  return {
    props: {
      notes,
      userInfo,
    },
  };
}
