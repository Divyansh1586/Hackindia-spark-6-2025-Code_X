# Updated app.py with corrected PDF processing
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import List
import os
from dotenv import load_dotenv
import socket
import urllib3
from PyPDF2 import PdfReader
from langchain_community.document_loaders import PyPDFLoader, UnstructuredURLLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import PromptTemplate
from auth import router as auth_router, get_current_user
from models import User, SessionData
from database import Base, engine, SessionLocal
from sqlalchemy.orm import Session

# If using FastAPI
from fastapi.middleware.cors import CORSMiddleware


# Load environment variables
load_dotenv()

# Set default socket timeout
socket.setdefaulttimeout(120)
urllib3.util.timeout.Timeout.DEFAULT_TIMEOUT = 120

# Init DB
Base.metadata.create_all(bind=engine)

# Google API key
api_key = os.getenv("GOOGLE_API_KEY")

# FastAPI app
app = FastAPI(title="Document AI Assistant", description="Process PDFs, URLs, Query, and Summarize")
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class URLRequest(BaseModel):
    urls: List[HttpUrl]

class QueryRequest(BaseModel):
    query: str
    session_id: str

# In-memory vector store
vectorstore_cache = {}

# Gemini Models
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", request_timeout=120)
llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-pro", temperature=0.7, max_output_tokens=2048, request_timeout=120)

def save_session_data(session_id: str, user_id: int, content_type: str, content: str):
    db: Session = SessionLocal()
    session = SessionData(session_id=session_id, user_id=user_id, content_type=content_type, content=content)
    db.add(session)
    db.commit()
    db.close()

async def process_pdf_task(path, session_id, user_id):
    reader = PdfReader(path)
    text = ""
    for i, page in enumerate(reader.pages):
        extracted = page.extract_text()
        if not extracted:
            print(f"⚠️ Page {i} is empty or couldn't be read")
        text += extracted or ""

    chunks = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100).split_text(text)
    vectorstore = FAISS.from_texts(chunks, embeddings)
    vectorstore_cache[session_id] = vectorstore
    print(f"✅ Vectorstore populated with {len(chunks)} chunks for session: {session_id}")

    save_session_data(session_id, user_id, "pdf", text)
    os.remove(path)

@app.get("/")
def root():
    return {"message": "Welcome to Document AI Assistant API"}

@app.post("/process-urls")
async def process_urls(request: URLRequest, background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    session_id = f"url_{hash(str(request.urls) + user.username)}"
    background_tasks.add_task(process_urls_task, request.urls, session_id, user.id)
    return {"session_id": session_id, "message": "URL processing started"}

async def process_urls_task(urls, session_id, user_id):
    loader = UnstructuredURLLoader(urls=urls)
    data = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.split_documents(data)
    text = "\n\n".join([doc.page_content for doc in docs])
    vectorstore_cache[session_id] = FAISS.from_documents(docs, embeddings)
    save_session_data(session_id, user_id, "url", text)

@app.post("/process-pdf")
async def process_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...), user: User = Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    session_id = f"pdf_{hash(file.filename + user.username)}"
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    with open(temp_path, "wb") as f:
        contents = await file.read()
        f.write(contents)
    background_tasks.add_task(process_pdf_task, temp_path, session_id, user.id)
    return {"session_id": session_id, "message": "PDF processing started"}

@app.post("/query")
async def query(request: QueryRequest, user: User = Depends(get_current_user)):
    if request.session_id not in vectorstore_cache:
        raise HTTPException(status_code=404, detail="Session not found")
    docs = vectorstore_cache[request.session_id].similarity_search(request.query, k=4)
    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template="You are a helpful assistant. Use the following context:\n\n{context}\n\nQ: {question}\nA:"
    )
    chain = load_qa_chain(llm, chain_type="stuff", prompt=prompt)
    response = chain({"input_documents": docs, "question": request.query}, return_only_outputs=True)
    return {
        "answer": response["output_text"],
        "sources": [{"index": i + 1, "preview": d.page_content[:300]} for i, d in enumerate(docs)]
    }

@app.post("/summarize-pdf")
async def summarize(request: QueryRequest, user: User = Depends(get_current_user)):
    if request.session_id not in vectorstore_cache or not request.session_id.startswith("pdf_"):
        raise HTTPException(status_code=404, detail="Invalid session")
    docs = vectorstore_cache[request.session_id].similarity_search("", k=20)
    map_prompt = PromptTemplate(template="Summarize:\n{text}", input_variables=["text"])
    combine_prompt = PromptTemplate(template="Combine:\n{text}", input_variables=["text"])
    chain = load_summarize_chain(llm, chain_type="map_reduce", map_prompt=map_prompt, combine_prompt=combine_prompt)
    return {"summary": chain.run(docs)}

@app.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}


@app.get("/status/{session_id}")
def status(session_id: str, user: User = Depends(get_current_user)):
    return {"status": "complete" if session_id in vectorstore_cache else "not_found"}

@app.delete("/session/{session_id}")
def delete(session_id: str, user: User = Depends(get_current_user)):
    if session_id in vectorstore_cache:
        del vectorstore_cache[session_id]
        return {"message": "Session deleted"}
    raise HTTPException(status_code=404, detail="Session not found")

@app.get("/load-session/{session_id}")
def load_session(session_id: str, user: User = Depends(get_current_user)):
    db: Session = SessionLocal()
    session = db.query(SessionData).filter_by(session_id=session_id, user_id=user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or unauthorized")

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    if session.content_type == "pdf":
        chunks = splitter.split_text(session.content)
        vectorstore_cache[session_id] = FAISS.from_texts(chunks, embeddings)
    elif session.content_type == "url":
        docs = [{"page_content": c} for c in session.content.split("\n\n")]
        vectorstore_cache[session_id] = FAISS.from_documents(docs, embeddings)

    return {"message": "Session loaded", "session_id": session_id}

@app.get("/my-sessions")
def my_sessions(user: User = Depends(get_current_user)):
    db: Session = SessionLocal()
    sessions = db.query(SessionData).filter_by(user_id=user.id).all()
    return {
        "sessions": [
            {
                "session_id": s.session_id,
                "type": s.content_type,
                "created_at": s.created_at.isoformat(),  # or str(s.created_at)
                "title": s.title,
                "status": s.status,
            }
            for s in sessions
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", port=8000, host="0.0.0.0", reload=True)
