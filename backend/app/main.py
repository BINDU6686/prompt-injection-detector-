from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.detector import router

app = FastAPI(
    title="Prompt Injection Detection Framework",
    description="A multi-layer framework for detecting prompt injection attacks in LLM applications",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Prompt Injection Detection Framework",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}