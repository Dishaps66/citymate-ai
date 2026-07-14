# RAG Workflow

Permitted RAG content:

- Official city documents.
- Government notifications.
- Transport documents.
- Tourism documents.
- Verified accommodation policies.
- User-owned saved plans.
- App FAQs and emergency guidance.

Workflow:

1. Ingest documents from permitted sources.
2. Extract and clean text.
3. Chunk content.
4. Attach title, authority, source URL, publication date, update date, city, category, and language.
5. Create embeddings.
6. Store chunks in `rag_chunks` with pgvector.
7. Retrieve by semantic similarity and metadata filters.
8. Rerank.
9. Generate answers using retrieved context only.
10. Return citations.
11. Refuse unsupported factual claims.
