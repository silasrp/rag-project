import os
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector

load_dotenv()

# Ingestion is synchronous — use standard postgresql:// driver
db_url = os.environ["DATABASE_URL"].replace(
    "postgresql+asyncpg://", "postgresql+psycopg://"
).replace(
    "postgresql://", "postgresql+psycopg://"
)

loader = DirectoryLoader("./docs", glob="**/*.md", loader_cls=UnstructuredMarkdownLoader)
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    add_start_index=True,
)
chunks = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

PGVector.from_documents(
    documents=chunks,
    embedding=embeddings,
    connection=db_url,
    collection_name="tech_docs",
)
print(f"Indexed {len(chunks)} chunks from {len(documents)} documents")