import os
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

_dir = os.path.dirname(os.path.abspath(__file__))
_chroma_path = os.path.join(_dir, "chroma_db")

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")


def get_context(question: str):
    vectorstore = Chroma(
        persist_directory=_chroma_path,
        embedding_function=embeddings,
        collection_name="tech_docs",
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    docs = retriever.invoke(question)
    return docs


prompt = ChatPromptTemplate.from_template("""
You are a helpful assistant for technical documentation.
Answer the question using ONLY the context below.
If the answer isn't in the context, say so - don't make things up.

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