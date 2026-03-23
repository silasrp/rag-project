from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from main import chain

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],  # update after Vercel deploy
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str

@app.post("/query")
async def query_docs(body: Query):
    async def generate():
        async for chunk in chain.astream(body.question):
            yield f"data: {chunk}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")