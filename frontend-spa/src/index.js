// frontend-spa/src/index.js

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Keycloak from "keycloak-js";
import axios from "axios";
import NotesList from "./components/NotesList";
import { kcConfig } from "./kc-config";

// Tworzymy instancję Keycloak (z konfiguracją z pliku kc-config.js)
const keycloak = new Keycloak(kcConfig);

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((auth) => {
        if (auth) {
          setAuthenticated(true);
          fetchNotes();
        } else {
          console.error("Keycloak: nie udało się zalogować");
        }
      })
      .catch((err) => {
        console.error("Keycloak init error:", err);
      });
  }, []);

  const fetchNotes = () => {
    keycloak
      .updateToken(30)
      .then(() => {
        axios
          .get("http://localhost:8000/notes", {
            headers: { Authorization: `Bearer ${keycloak.token}` },
          })
          .then((res) => {
            setNotes(res.data);
          })
          .catch((err) => {
            console.error("Błąd pobierania notatek:", err);
          });
      })
      .catch((err) => {
        console.error("Nie udało się odświeżyć tokena:", err);
      });
  };

  const createNote = (title, content) => {
    keycloak
      .updateToken(30)
      .then(() => {
        axios
          .post(
            "http://localhost:8000/notes",
            { title, content },
            { headers: { Authorization: `Bearer ${keycloak.token}` } }
          )
          .then(() => {
            fetchNotes();
          })
          .catch((err) => {
            console.error("Błąd tworzenia notatki:", err);
          });
      })
      .catch((err) => {
        console.error("Błąd odświeżania tokena (create):", err);
      });
  };

  const deleteNote = (id) => {
    keycloak
      .updateToken(30)
      .then(() => {
        axios
          .delete(`http://localhost:8000/notes/${id}`, {
            headers: { Authorization: `Bearer ${keycloak.token}` },
          })
          .then(() => {
            fetchNotes();
          })
          .catch((err) => {
            console.error("Błąd usuwania notatki:", err);
          });
      })
      .catch((err) => {
        console.error("Błąd odświeżania tokena (delete):", err);
      });
  };

  const updateNote = (id, title, content) => {
    keycloak
      .updateToken(30)
      .then(() => {
        axios
          .put(
            `http://localhost:8000/notes/${id}`,
            { title, content },
            { headers: { Authorization: `Bearer ${keycloak.token}` } }
          )
          .then(() => {
            fetchNotes();
          })
          .catch((err) => {
            console.error("Błąd aktualizacji notatki:", err);
          });
      })
      .catch((err) => {
        console.error("Błąd odświeżania tokena (update):", err);
      });
  };

  if (!authenticated) {
    return <div>Trwa logowanie...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>Twoje Notatki</h1>
      <NotesList
        notes={notes}
        onCreate={createNote}
        onDelete={deleteNote}
        onUpdate={updateNote}
      />
      <button
        style={{ marginTop: "20px" }}
        onClick={() => {
          keycloak.logout({ redirectUri: window.location.origin });
        }}
      >
        Wyloguj
      </button>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);