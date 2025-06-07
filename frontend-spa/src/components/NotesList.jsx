import React, { useState } from "react";

export default function NotesList({ notes, onCreate, onDelete, onUpdate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onCreate(title.trim(), content.trim());
    setTitle("");
    setContent("");
  };

  const startEdit = (note) => {
    setEditId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    onUpdate(editId, editTitle.trim(), editContent.trim());
    setEditId(null);
    setEditTitle("");
    setEditContent("");
  };

  return (
    <div>
      <h2>Dodaj nową notatkę</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Tytuł"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "10px",
            boxSizing: "border-box",
          }}
        />
        <textarea
          placeholder="Treść"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "10px",
            boxSizing: "border-box",
            minHeight: "80px",
          }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Utwórz
        </button>
      </form>

      <h2>Lista notatek</h2>
      {notes.length === 0 && <div>Brak notatek</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {notes.map((note) => (
          <li
            key={note.id}
            style={{
              marginBottom: "20px",
              padding: "15px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            {editId === note.id ? (
              <form onSubmit={handleEdit}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "6px",
                    marginBottom: "8px",
                    boxSizing: "border-box",
                  }}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "6px",
                    marginBottom: "8px",
                    boxSizing: "border-box",
                    minHeight: "60px",
                  }}
                />
                <button type="submit" style={{ marginRight: "8px" }}>
                  Zapisz
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  style={{ backgroundColor: "#eee" }}
                >
                  Anuluj
                </button>
              </form>
            ) : (
              <div>
                <strong>{note.title}</strong>{" "}
                <span style={{ color: "#666", fontSize: "0.9em" }}>
                  (właściciel: {note.ownerId || note.owner_id})
                </span>
                <p style={{ margin: "8px 0" }}>{note.content}</p>
                <button
                  onClick={() => startEdit(note)}
                  style={{ marginRight: "8px" }}
                >
                  Edytuj
                </button>
                <button
                  onClick={() => onDelete(note.id)}
                  style={{ backgroundColor: "#f8d7da" }}
                >
                  Usuń
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}