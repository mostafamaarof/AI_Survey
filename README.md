
# AI Audit Survey Starter

This is a minimal starter for your survey:
- `/survey` : public form
- `/thank-you` : confirmation page
- `/admin` : simple dashboard (counts + a sample chart)
- API routes: `/api/survey`, `/api/submit`, `/api/stats`

## Quick start
1) Create a Supabase project, copy the URL and Service Role Key.
2) Run the SQL from `db/schema_and_seed.sql` in Supabase SQL editor.
3) Copy `.env.local.example` to `.env.local` and set your values.
4) `npm install && npm run dev`
5) Visit http://localhost:3000/survey
