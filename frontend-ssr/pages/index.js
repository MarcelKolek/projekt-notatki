import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home({ keycloak }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [notesCount, setNotesCount] = useState(null);

  const fetchNotes = async () => {
    try {
      await keycloak.updateToken(30);
      const token = keycloak.token;

      const response = await axios.get(`${process.env.API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Błąd pobierania notatek:', error);
      setLoading(false);
    }
  };

  const fetchNotesCount = async () => {
    try {
      await keycloak.updateToken(30);
      const token = keycloak.token;

      const response = await axios.get(`${process.env.API_URL}/notes/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotesCount(response.data.count);
    } catch (error) {
      console.error('Błąd pobierania liczby notatek:', error);
    }
  };

  useEffect(() => {
    if (keycloak?.tokenParsed) {
      const userRoles = keycloak.tokenParsed.realm_access?.roles || [];
      setRoles(userRoles);

      fetchNotes();
      if (userRoles.includes('ADMIN')) {
        fetchNotesCount();
      }
    }
  }, [keycloak]);

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  if (loading) {
    return <div className="loading">Ładowanie notatek…</div>;
  }

  return (
    <div className="container">
      <h1 className="main-title">Notatki (SSR)</h1>

      {roles.includes('ADMIN') && notesCount !== null && (
        <div className="notes-count">
          <strong>Liczba wszystkich notatek w systemie: {notesCount}</strong>
        </div>
      )}

      <button
        className="btn btn-secondary logout-button"
        onClick={handleLogout}
      >
        Wyloguj
      </button>

      <ul className="notes-list">
        {notes.length === 0 && <div className="empty">Brak notatek</div>}
        {[...notes].reverse().map((note) => (
          <li key={note.id} className="note-item">
            <h3 className="note-title">{note.title}</h3>
            <p className="note-content">{note.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}