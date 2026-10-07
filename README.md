# My Music
Private music library. Static frontend (Vercel) + Supabase (database, auth, file storage).

- `/` — player: Home, Albums, Album page, Songs, Search, Settings, 7 themes
- `/admin` — CMS: dashboard, albums, tracks (128/320 kbps + square art), publish/draft, featured, export

## Setup
1. Supabase: SQL editor > run `schema.sql`. Auth > disable sign-ups, create your user (Auto Confirm).
2. Edit `assets/config.js` with your Supabase URL + anon key.
3. Push to GitHub, import in Vercel (Framework: Other, no build command).
4. Open the site on your phone > Add to Home Screen.

Legacy Mega links keep playing; new uploads go to the private Supabase `music` bucket.
