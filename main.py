import os
from dotenv import load_dotenv
from langchain_postgres import PGVector
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

load_dotenv()

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Switch from asyncpg to psycopg3
connection = os.environ["DATABASE_URL"].replace(
    "postgresql+asyncpg://", "postgresql+psycopg://"
).replace(
    "postgresql://", "postgresql+psycopg://"
)


async def get_context(question: str):
    try:
        vectorstore = PGVector(
            embeddings=embeddings,
            connection=connection,
            collection_name="tech_docs",
            async_mode=True,
        )
        retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
        return await retriever.ainvoke(question)
    except ValueError:
        return []

prompt = ChatPromptTemplate.from_template("""
You are a helpful assistant for technical documentation.
Answer the question using ONLY the context below.
If the answer isn't in the context, say so — don't make things up.

Context:
{context}

Question: {question}

Answer concisely with references to specific sections when relevant.
""")

llm = ChatOpenAI(model="gpt-4o-mini", streaming=True)

chain = (
    {"context": RunnableLambda(get_context), "question": lambda x: x}
    | prompt
    | llm
    | StrOutputParser()
)