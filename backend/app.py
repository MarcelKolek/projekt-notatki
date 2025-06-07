import os
from fastapi import FastAPI, Depends, HTTPException, status, Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, jwk, JWTError
import requests
from typing import List
from pydantic import BaseModel
from uuid import UUID
from sqlalchemy import create_engine, Column, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import time
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://notes_user:notes_pass@db:5432/notesdb")
KEYCLOAK_JWKS_URL = os.getenv("KEYCLOAK_JWKS_URL")
KEYCLOAK_ISSUERS = os.getenv("KEYCLOAK_ISSUERS", "http://localhost:8080/auth/realms/notes-realm").split(",")
KEYCLOAK_ISSUERS = [iss.strip() for iss in KEYCLOAK_ISSUERS if iss.strip()]
ALGORITHMS = ["RS256"]

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class NoteCreate(BaseModel):
    title: str
    content: str

class NoteOut(BaseModel):
    id: UUID
    title: str
    content: str
    owner_id: str

class Note(Base):
    __tablename__ = "notes"
    id = Column(PGUUID(as_uuid=True), primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    owner_id = Column(String(100), nullable=False)

Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer()
jwks = None

@app.on_event("startup")
def retrieve_jwks_with_retry():
    global jwks
    while True:
        try:
            resp = requests.get(KEYCLOAK_JWKS_URL, timeout=5)
            resp.raise_for_status()
            jwks = resp.json()
            print("JWKS pobrane z Keycloak.")
            break
        except Exception as e:
            print(f"Nie można pobrać JWKS z Keycloak. Ponawiam za 5 sekund…")
            time.sleep(5)

def verify_token(token: str):
    if jwks is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serwer nie jest gotowy do weryfikacji tokenów"
        )

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        print("Niepoprawny nagłówek JWT:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy nagłówek tokena"
        )

    kid = unverified_header.get("kid")
    if not kid:
        print("Brak pola 'kid' w nagłówku JWT")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak identyfikatora klucza (kid) w tokenie"
        )

    key_dict = None
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            key_dict = key
            break

    if key_dict is None:
        print(f"Nie znaleziono JWK o kid = {kid} w zestawie JWKS")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieznany klucz JWT"
        )

    public_key = jwk.construct(key_dict)

    try:
        public_pem = public_key.to_pem().decode("utf-8")
        payload = jwt.decode(
            token,
            public_pem,
            algorithms=ALGORITHMS,
            issuer=KEYCLOAK_ISSUERS,
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        print("Błąd dekodowania JWT (payload):", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy lub wygasły token"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("sub")
    roles = payload.get("realm_access", {}).get("roles", [])
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Brak pola sub w tokenie")
    return {"sub": user_id, "roles": roles}

def is_admin(roles: List[str]) -> bool:
    return "ADMIN" in roles

@app.post("/notes", response_model=NoteOut)
def create_note(note_in: NoteCreate, user=Depends(get_current_user)):
    db = SessionLocal()
    new_note = Note(
        id=uuid.uuid4(),
        title=note_in.title,
        content=note_in.content,
        owner_id=user["sub"]
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    db.close()
    return NoteOut(
        id=new_note.id,
        title=new_note.title,
        content=new_note.content,
        owner_id=new_note.owner_id
    )

@app.get("/notes", response_model=List[NoteOut])
def get_notes(user=Depends(get_current_user)):
    db = SessionLocal()
    if is_admin(user["roles"]):
        notes = db.query(Note).all()
    else:
        notes = db.query(Note).filter(Note.owner_id == user["sub"]).all()
    result = [NoteOut(id=n.id, title=n.title, content=n.content, owner_id=n.owner_id) for n in notes]
    db.close()
    return result

@app.get("/notes/count")
def count_notes(user=Depends(get_current_user)):
    db = SessionLocal()
    count = db.query(Note).count()
    db.close()
    return {"count": count}

@app.get("/notes/{note_id}", response_model=NoteOut)
def get_note(note_id: UUID = Path(...), user=Depends(get_current_user)):
    db = SessionLocal()
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        db.close()
        raise HTTPException(status_code=404, detail="Notatka nie znaleziona")
    if not is_admin(user["roles"]) and note.owner_id != user["sub"]:
        db.close()
        raise HTTPException(status_code=403, detail="Brak uprawnień do tej notatki")
    out = NoteOut(id=note.id, title=note.title, content=note.content, owner_id=note.owner_id)
    db.close()
    return out

@app.put("/notes/{note_id}", response_model=NoteOut)
def update_note(note_id: UUID, note_in: NoteCreate, user=Depends(get_current_user)):
    db = SessionLocal()
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        db.close()
        raise HTTPException(status_code=404, detail="Notatka nie znaleziona")
    if not is_admin(user["roles"]) and note.owner_id != user["sub"]:
        db.close()
        raise HTTPException(status_code=403, detail="Brak uprawnień do edycji tej notatki")
    note.title = note_in.title
    note.content = note_in.content
    db.commit()
    db.refresh(note)
    out = NoteOut(id=note.id, title=note.title, content=note.content, owner_id=note.owner_id)
    db.close()
    return out

@app.delete("/notes/{note_id}")
def delete_note(note_id: UUID, user=Depends(get_current_user)):
    db = SessionLocal()
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        db.close()
        raise HTTPException(status_code=404, detail="Notatka nie znaleziona")
    if not is_admin(user["roles"]) and note.owner_id != user["sub"]:
        db.close()
        raise HTTPException(status_code=403, detail="Brak uprawnień do usunięcia tej notatki")
    db.delete(note)
    db.commit()
    db.close()
    return {"detail": "Notatka usunięta"}

@app.get("/")
def root():
    return {"msg": "Notes API is up"}