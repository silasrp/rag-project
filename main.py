from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=OpenAIEmbeddings(model="text-embedding-3-small"),
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

llm = ChatOpenAI(model="gpt-4o-mini", streaming=True)

chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
