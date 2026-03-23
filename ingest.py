import os
from dotenv import load_dotenv
load_dotenv()
from langchain_community.document_loaders import DirectoryLoader, UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

_dir = os.path.dirname(os.path.abspath(__file__))
_docs_path = os.path.join(_dir, "docs")
_chroma_path = os.path.join(_dir, "chroma_db")

loader = DirectoryLoader(_docs_path, glob="**/*.md", loader_cls=UnstructuredMarkdownLoader)
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    add_start_index=True,
)
chunks = splitter.split_documents(documents)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Delete existing collection to avoid duplicates, then re-create
vectorstore = Chroma(
    persist_directory=_chroma_path,
    embedding_function=embeddings,
    collection_name="tech_docs",
)
vectorstore.delete_collection()

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory=_chroma_path,
    collection_name="tech_docs",
)
print(f"Indexed {len(chunks)} chunks from {len(documents)} documents")