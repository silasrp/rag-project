from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=OllamaEmbeddings(model="nomic-embed-text"),
    collection_name="tech_docs",
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

prompt = ChatPromptTemplate.from_template("""
You are a helpful assistant for technical documentation.
Answer the question using ONLY the context below.
If the answer isn't in the context, say so — don't make things up.

Context:
{context}

Question: {question}

Answer concisely with references to specific sections when relevant.
""")

llm = ChatOllama(model="llama3.2", streaming=True)

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
