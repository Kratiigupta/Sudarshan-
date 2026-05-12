# 🚀 Sudarshan Deployment Guide (Supabase + Vercel)

Follow these steps to deploy your application.

## 1. Setup Supabase Database
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** in your project.
3. Copy the contents of [SUPABASE_SETUP.sql](./SUPABASE_SETUP.sql) and paste it into the editor.
4. Click **Run**.
   - This will create all the necessary tables (profiles, itineraries, incidents, etc.).
   - It will also enable **Row Level Security (RLS)** to keep your data safe.

## 2. Push Code to GitHub
Since `git` might not be available in your environment, run these commands in your local terminal:

```bash
# Initialize git if not already done
git init

# Add the remote repository
git remote add origin https://github.com/Kratiigupta/Sudarshan-.git

# Stage all files
git add .

# Commit changes
git commit -m "chore: prepare for deployment to vercel and supabase"

# Push to GitHub
git push -u origin main
```

## 3. Deploy Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** > **Project**.
3. Import your GitHub repository (`Kratiigupta/Sudarshan-`).
4. **Environment Variables**: In the "Environment Variables" section, add the following:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `VITE_GEMINI_API_KEY`: Your Google Gemini API Key.
5. Click **Deploy**.

## 4. Post-Deployment
- Once deployed, your app will be live at a `.vercel.app` URL.
- Everything (Auth, Database, AI) will work directly from the browser via Supabase.

---

### Why no Render?
We have moved all backend logic to **Supabase** (Database-as-a-Service). This makes your app:
1. **Faster**: Fewer network hops between your frontend and database.
2. **Cheaper**: No need to pay for a separate server.
3. **Easier to Maintain**: One less service to manage.
