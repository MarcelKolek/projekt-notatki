import React from "react";
import axios from "axios";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REALM = process.env.REALM;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const API_URL = process.env.API_URL;

export default function NoteDetails({ note, userInfo }) {
  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Szczegóły notatki</h1>
      <h2>{note.title}</h2>
      <p>{note.content}</p>
      <p>
        <em>Właściciel: {note.owner_id}</em>
      </p>
      <button onClick={() => (window.location.href = "/")}>Powrót</button>
    </div>
  );
}

export async function getServerSideProps({ req, res, params, query }) {
  const cookies = parse(req.headers.cookie || "");
  let token = cookies["kc_token"];

  if (!token && query.code) {
    const paramsToken = new URLSearchParams();
    paramsToken.append("grant_type", "authorization_code");
    paramsToken.append("code", query.code);
    paramsToken.append("client_id", CLIENT_ID);
    paramsToken.append("client_secret", CLIENT_SECRET);
    paramsToken.append(
      "redirect_uri",
      `http://${req.headers.host}/notes/${params.id}`
    );

    const tokenRes = await axios.post(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      paramsToken
    );
    token = tokenRes.data.access_token;
    res.setHeader("Set-Cookie", `kc_token=${token}; HttpOnly; Path=/`);
  }

  if (!token) {
    const redirectUri = encodeURIComponent(
      `http://${req.headers.host}/notes/${params.id}`
    );
    return {
      redirect: {
        destination: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}`,
        permanent: false,
      },
    };
  }

  // Uzyskujemy notatkę
  let note = null;
  try {
    const noteRes = await axios.get(`${API_URL}/notes/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    note = noteRes.data;
  } catch (err) {
    return { notFound: true };
  }

  // Dekodujemy token dla userInfo (opcjonalnie)
  const decoded = jwt.decode(token);
  const userInfo = {
    preferred_username: decoded.preferred_username || decoded.sub,
    roles: decoded.realm_access ? decoded.realm_access.roles : [],
  };

  return {
    props: {
      note,
      userInfo,
    },
  };
}
