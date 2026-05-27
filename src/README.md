Backend src/ skeleton

This folder contains recommended architecture scaffolding for the backend service.

Structure:
- config/ - env validation and app config
- loaders/ - db, cache, logger setup
- controllers/ - express route handlers (thin)
- services/ - business logic
- repositories/ - DB access and queries
- middleware/ - auth, error handler, validators
- utils/ - helpers (ApiError, asyncHandler)

This is an onboarding skeleton. Move features incrementally from `services/backend/components/*` into this structure.
