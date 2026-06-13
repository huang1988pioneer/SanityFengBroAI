[OPEN] sanity-write-fail

# Debug Record

- Symptom: UI shows data loaded/imported, but Sanity Studio has no corresponding documents.
- Expected: Import/write actions should create or update documents visible in Sanity Studio.
- Scope: Subscription module first, possibly other modules sharing the same write path.

# Hypotheses

1. The UI reads from local state or CSV cache and falsely reports success without calling the write API.
2. The API route returns success before Sanity mutation is actually executed or awaited.
3. The Sanity client writes to a different dataset/project/apiVersion than the Studio currently opened by the user.
4. The write request reaches the API, but document `_type` or payload shape does not match the Studio schema, so documents are not created as expected.
5. Authentication/token permissions allow read but not write, and the failure is swallowed or transformed into a misleading success state.

# Plan

1. Inspect the import and write flow for the subscription module.
2. Add instrumentation only at the key request/response boundaries.
3. Reproduce and collect runtime evidence.
4. Implement the smallest fix supported by the evidence.
