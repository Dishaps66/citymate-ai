# Security and Privacy

- Supabase service-role keys must never be exposed to the browser.
- Browser variables are limited to `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_API_BASE_URL`.
- RLS is enabled on all public tables.
- User-owned policies restrict records by `user_id`.
- Accommodation contact details should be revealed only after consent.
- Emergency offline cards should store the minimum sensitive data necessary and should be protected in the client.
- Retrieved RAG text is data, not trusted instructions.
- Provider failures must not trigger AI-fabricated substitutes.
- Admin privileges should come from secure server-side checks or Supabase `app_metadata`, not user-editable metadata.
