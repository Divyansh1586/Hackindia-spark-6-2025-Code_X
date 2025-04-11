# from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body, BackgroundTasks
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel, HttpUrl
# from typing import List, Optional, Dict, Any
# import os
# import pickle
# import tempfile
# import socket
# import urllib3
# import requests
# import uvicorn
# from PyPDF2 import PdfReader
# from langchain_community.document_loaders import PyPDFLoader, UnstructuredURLLoader
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_community.vectorstores import FAISS
# from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# from langchain.chains.question_answering import load_qa_chain
# from langchain.chains.summarize import load_summarize_chain
# from langchain.prompts import PromptTemplate

# # Configuration
# socket.setdefaulttimeout(120)
# urllib3.util.timeout.Timeout.DEFAULT_TIMEOUT = 120

# # API Key
# GOOGLE_API_KEY = 'AIzaSyCGqqf0NgHDG1hs4F5V9TiCwznrwGoN-oI'  # Insert your Gemini API key
# os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# # Initialize FastAPI app
# app = FastAPI(title="Document AI Assistant API", description="API for processing documents and answering questions using Gemini models")

# # Initialize models
# try:
#     embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", request_timeout=120)
#     llm = ChatGoogleGenerativeAI(model="models/gemini-1.5-pro", temperature=0.7, max_output_tokens=2048, request_timeout=120)
# except Exception as e:
#     print(f"Model initialization error: {str(e)}")

# # In-memory storage (Replace this with a database in production)
# vectorstore_cache = {}

# # Data models
# class URLRequest(BaseModel):
#     urls: List[HttpUrl]

# class QueryRequest(BaseModel):
#     query: str
#     session_id: str

# # Routes
# @app.get("/")
# def read_root():
#     return {"message": "Welcome to Document AI Assistant API"}

# @app.post("/process-urls")
# async def process_urls(request: URLRequest, background_tasks: BackgroundTasks):
#     session_id = f"url_{hash(str(request.urls))}"
    
#     try:
#         # Process URLs in the background
#         background_tasks.add_task(process_urls_task, request.urls, session_id)
#         return {"session_id": session_id, "message": "URL processing started"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"URL processing error: {str(e)}")

# async def process_urls_task(urls, session_id):
#     try:
#         loader = UnstructuredURLLoader(urls=urls)
#         data = loader.load()
#         splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#         docs = splitter.split_documents(data)
#         vectorstore_cache[session_id] = FAISS.from_documents(docs, embeddings)
#     except Exception as e:
#         print(f"Background URL processing error: {str(e)}")

# @app.post("/process-pdf")
# async def process_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
#     if not file.filename.endswith(".pdf"):
#         raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
#     # Generate a unique session ID for this PDF
#     session_id = f"pdf_{hash(file.filename)}"
    
#     try:
#         # Save uploaded file temporarily
#         temp_file_path = f"/tmp/{file.filename}"
#         with open(temp_file_path, "wb") as buffer:
#             contents = await file.read()
#             buffer.write(contents)
        
#         # Process PDF in the background
#         background_tasks.add_task(process_pdf_task, temp_file_path, session_id)
        
#         return {"session_id": session_id, "message": "PDF processing started"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"PDF processing error: {str(e)}")

# async def process_pdf_task(file_path, session_id):
#     try:
#         pdf_reader = PdfReader(file_path)
#         text = "".join(page.extract_text() or "" for page in pdf_reader.pages)
#         chunks = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100).split_text(text)
#         vectorstore_cache[session_id] = FAISS.from_texts(chunks, embeddings)
        
#         # Clean up temp file
#         os.remove(file_path)
#     except Exception as e:
#         print(f"Background PDF processing error: {str(e)}")

# @app.post("/query")
# async def query_document(request: QueryRequest):
#     session_id = request.session_id
    
#     if session_id not in vectorstore_cache:
#         raise HTTPException(status_code=404, detail="Session not found or processing not complete")
    
#     try:
#         vectorstore = vectorstore_cache[session_id]
#         docs = vectorstore.similarity_search(request.query, k=4)
        
#         prompt = PromptTemplate(
#             input_variables=["context", "question"],
#             template="""
#             You are a helpful AI assistant that answers questions based on the context below.

#             Context:
#             {context}

#             Question:
#             {question}

#             Respond only from the context. If uncertain, say "I don't have enough information."
#             """
#         )
#         chain = load_qa_chain(llm, chain_type="stuff", prompt=prompt)
#         response = chain({"input_documents": docs, "question": request.query}, return_only_outputs=True)
        
#         # Format sources
#         sources = []
#         for i, doc in enumerate(docs):
#             sources.append({
#                 "index": i+1,
#                 "preview": doc.page_content[:300] + "..."
#             })
        
#         return {
#             "answer": response["output_text"],
#             "sources": sources
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Query error: {str(e)}")

# @app.post("/summarize-pdf")
# async def summarize_pdf(request: QueryRequest):
#     session_id = request.session_id
    
#     if session_id not in vectorstore_cache or not session_id.startswith("pdf_"):
#         raise HTTPException(status_code=404, detail="PDF session not found or processing not complete")
    
#     try:
#         vectorstore = vectorstore_cache[session_id]
#         docs = vectorstore.similarity_search("", k=20)  # Get a good sample of the document
        
#         map_prompt = PromptTemplate(template="Summarize:\n{text}", input_variables=["text"])
#         combine_prompt = PromptTemplate(template="Combine summaries into one:\n{text}", input_variables=["text"])

#         chain = load_summarize_chain(llm, chain_type="map_reduce", map_prompt=map_prompt, combine_prompt=combine_prompt)
#         summary = chain.run(docs)
        
#         return {"summary": summary}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Summarization error: {str(e)}")

# @app.get("/status/{session_id}")
# async def check_status(session_id: str):
#     if session_id in vectorstore_cache:
#         return {"status": "complete", "session_id": session_id}
#     else:
#         return {"status": "not_found", "session_id": session_id}

# @app.delete("/session/{session_id}")
# async def delete_session(session_id: str):
#     if session_id in vectorstore_cache:
#         del vectorstore_cache[session_id]
#         return {"message": f"Session {session_id} deleted successfully"}
#     else:
#         raise HTTPException(status_code=404, detail="Session not found")

# # For local development
# if __name__ == "__main__":
#     uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)