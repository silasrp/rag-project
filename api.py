from dotenv import load_dotenv
load_dotenv()
from main import chain
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()

class Query(BaseModel):
    question: str

@app.post("/query")
async def query_docs(body: Query):
    async def generate():
        async for chunk in chain.astream(body.question):
            yield f"data: {chunk}\n\n"
    return StreamingResponse(generate(), media_type="text/event-stream")
