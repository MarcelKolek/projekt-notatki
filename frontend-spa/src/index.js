import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Keycloak from "keycloak-js";
import axios from "axios";
import NotesList from "./components/NotesList";
import { kcConfig } from "./kc-config";
import "./styles.css";

const keycloak = new Keycloak(kcConfig);

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [notes, setNotes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [notesCount, setNotesCount] = useState(null);

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
          const tokenParsed = keycloak.tokenParsed;
          const userRoles =
            tokenParsed?.realm_access?.roles || [];
          setRoles(userRoles);
          fetchNotes();
          if (userRoles.includes("ADMIN")) {
            fetchNotesCount();
          }
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

  const fetchNotesCount = () => {
    keycloak
      .updateToken(30)
      .then(() => {
        axios
          .get("http://localhost:8000/notes/count", {
            headers: { Authorization: `Bearer ${keycloak.token}` },
          })
          .then((res) => {
            setNotesCount(res.data.count);
          })
          .catch((err) => {
            console.error("Błąd pobierania liczby notatek:", err);
          });
      })
      .catch((err) => {
        console.error("Błąd odświeżania tokena (count):", err);
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
            if (roles.includes("ADMIN")) fetchNotesCount();
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
            if (roles.includes("ADMIN")) fetchNotesCount();
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
    return <div className="loading">Trwa logowanie…</div>;
  }

  return (
    <div className="container">
      <h1 className="main-title">Twoje Notatki</h1>

      {roles.includes("ADMIN") && notesCount !== null && (
        <div className="notes-count">
          <strong>Liczba wszystkich notatek w systemie: {notesCount}</strong>
        </div>
      )}

      <button
        className="btn btn-secondary logout-button"
        onClick={() => {
          keycloak.logout({ redirectUri: window.location.origin });
        }}
      >
        Wyloguj
      </button>

      <NotesList
        notes={notes}
        onCreate={createNote}
        onDelete={deleteNote}
        onUpdate={updateNote}
      />
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);