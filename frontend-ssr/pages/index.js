import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home({ keycloak }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = async () => {
    try {
      await keycloak.updateToken(30);
      const token = keycloak.token;
      
      const response = await axios.get(`${process.env.API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Błąd pobierania notatek:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (keycloak) {
      fetchNotes();
    }
  }, [keycloak]);

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  if (loading) {
    return <div>Ładowanie notatek...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h1>Notatki: (SSR)</h1>
      
      <ul>
        {notes.map(note => (
          <li key={note.id} style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
          </li>
        ))}
      </ul>

      <button
        style={{ marginTop: "20px"}}
        onClick={handleLogout}
      >
        Wyloguj
      </button>
    </div>
  );
}