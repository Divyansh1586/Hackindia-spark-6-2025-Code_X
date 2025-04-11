from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import List
import os
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
from models import User
from database import Base, engine

# Set default socket timeout
socket.setdefaulttimeout(120)
urllib3.util.timeout.Timeout.DEFAULT_TIMEOUT = 120

# Init DB
Base.metadata.create_all(bind=engine)

# API Key (for Gemini)
os.environ["GOOGLE_API_KEY"] = "AIzaSyDGs1BYvkVZxB85Ul5O0hPEK2g3lnvm5DU"

# FastAPI app
app = FastAPI(title="Document AI Assistant", description="Process PDFs, URLs, Query, and Summarize")
app.include_router(auth_router)

# Models
class URLRequest(BaseModel):
    urls: List[HttpUrl]

class QueryRequest(BaseModel):
    query: str
    session_id: str

# Cache
vectorstore_cache = {}

# Gemini Models
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", request_timeout=120)
llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-pro", temperature=0.7, max_output_tokens=2048, request_timeout=120)

@app.get("/")
def root():
    return {"message": "Welcome to Document AI Assistant API"}

@app.post("/process-urls")
async def process_urls(request: URLRequest, background_tasks: BackgroundTasks, user: User = Depends(get_current_user)):
    session_id = f"url_{hash(str(request.urls))}"
    background_tasks.add_task(process_urls_task, request.urls, session_id)
    return {"session_id": session_id, "message": "URL processing started"}

async def process_urls_task(urls, session_id):
    loader = UnstructuredURLLoader(urls=urls)
    data = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.split_documents(data)
    vectorstore_cache[session_id] = FAISS.from_documents(docs, embeddings)

@app.post("/process-pdf")
async def process_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...), user: User = Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    session_id = f"pdf_{hash(file.filename)}"
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        contents = await file.read()
        f.write(contents)
    background_tasks.add_task(process_pdf_task, temp_path, session_id)
    return {"session_id": session_id, "message": "PDF processing started"}

async def process_pdf_task(path, session_id):
    reader = PdfReader(path)
    text = "".join(page.extract_text() or "" for page in reader.pages)
    chunks = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100).split_text(text)
    vectorstore_cache[session_id] = FAISS.from_texts(chunks, embeddings)
    os.remove(path)

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

@app.get("/status/{session_id}")
def status(session_id: str, user: User = Depends(get_current_user)):
    return {"status": "complete" if session_id in vectorstore_cache else "not_found"}

@app.delete("/session/{session_id}")
def delete(session_id: str, user: User = Depends(get_current_user)):
    if session_id in vectorstore_cache:
        del vectorstore_cache[session_id]
        return {"message": "Session deleted"}
    raise HTTPException(status_code=404, detail="Session not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", port=8000, host="0.0.0.0", reload=True)
