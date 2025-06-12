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
      <h2 className="subtitle">Dodaj nową notatkę</h2>
      <form onSubmit={handleSubmit} className="note-form">
        <input
          type="text"
          className="input"
          placeholder="Tytuł"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="textarea"
          placeholder="Treść"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">
          Utwórz
        </button>
      </form>

      <h2 className="subtitle">Lista notatek</h2>
      {notes.length === 0 && <div className="empty">Brak notatek</div>}
      <ul className="notes-list">
        {[...notes].reverse().map((note) => (
          <li key={note.id} className="note-item">
            {editId === note.id ? (
              <form onSubmit={handleEdit} className="edit-form">
                <input
                  type="text"
                  className="input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
                <textarea
                  className="textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  Zapisz
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="btn btn-secondary"
                >
                  Anuluj
                </button>
              </form>
            ) : (
              <div className="note-view">
                <strong className="note-title">{note.title}</strong>{" "}
                <span className="note-owner">
                  (właściciel: {note.ownerId || note.owner_id})
                </span>
                <p className="note-content">{note.content}</p>
                <button
                  onClick={() => startEdit(note)}
                  className="btn btn-secondary"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => onDelete(note.id)}
                  className="btn btn-danger"
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