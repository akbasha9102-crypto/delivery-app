# 🧠 AI Context & Memory File (CulinaShare Delivery App)

## 📌 Project Overview
This is a Delivery Application (CulinaShare) built with:
- **Frontend**: React Native (Expo Router v3), NativeWind v4 (Tailwind CSS for React Native)
- **Backend/DB**: Supabase (PostgreSQL, Auth, REST API)
- **Deployment**: Vercel (as a Single Page Application `spa` web build)
- **State Management**: React Hooks + Supabase Realtime (optional)

## 🏗️ Architecture & Navigation
- Uses Expo Router with grouping:
  - `/(auth)/login.tsx` -> Login Screen
  - `/(client)/home.tsx` -> Main Menu for clients
  - `/(client)/cart.tsx` -> Cart for clients
  - `/(admin)/dashboard.tsx` -> Admin statistics and control panel
  - `/(admin)/orders.tsx` -> Live orders management
- **Auth Guard**: `_layout.tsx` enforces authentication. If no session exists, it forces redirect to `/(auth)/login`.

## 🔗 Live Application Links
- **Base URL:** [https://delivery-app2-ali-iraq.vercel.app](https://delivery-app2-ali-iraq.vercel.app)
- **Login Page:** [https://delivery-app2-ali-iraq.vercel.app/login](https://delivery-app2-ali-iraq.vercel.app/login)
- **Client Menu:** [https://delivery-app2-ali-iraq.vercel.app/home](https://delivery-app2-ali-iraq.vercel.app/home)
- **Client Cart:** [https://delivery-app2-ali-iraq.vercel.app/cart](https://delivery-app2-ali-iraq.vercel.app/cart)
- **Admin Dashboard:** [https://delivery-app2-ali-iraq.vercel.app/dashboard](https://delivery-app2-ali-iraq.vercel.app/dashboard)
- **Admin Live Orders:** [https://delivery-app2-ali-iraq.vercel.app/orders](https://delivery-app2-ali-iraq.vercel.app/orders)

## 🗄️ Database Schema (Supabase)
The project uses the following tables:
1. `profiles`: id (uuid), role (text: client/admin), name, phone.
2. `categories`: id, name, icon.
3. `items`: id, category_id, name, description, price, image_url, is_available.
4. `orders`: id, user_id, status (pending, accepted, delivered), total_amount, delivery_address.
5. `order_items`: id, order_id, item_id, quantity, price.

## 🔐 Credentials & Secrets (PUBLIC FOR AI ACCESS)
The user explicitly authorized storing all credentials here so any AI agent can resume work instantly.

- **Supabase Project Ref:** `gbmwrvnmvobvieembxmf`
- **Supabase URL:** `https://gbmwrvnmvobvieembxmf.supabase.co`
- **Publishable Key:** `sb_publishable_DB8lKUjdnAah-jNbpFV22w_7Id2Eggr`
- **Secret/Service Role Key:** `sb_secret_yvsF82XpNQZuDmq7G_Rpfg_0MuqQ7it`
- **Database Password:** `H87oN$y44bH$`
- **Supabase Personal Access Token (MCP):** `sbp_5b97b442b36b667cb41a5352067615dc8ecf376d`

**Admin Login Account:**
- **Email:** `admin@app.com`
- **Password:** `admin123`

## 🚀 Deployment Rules & CI/CD Path (CRITICAL)
Whenever you modify the code, you MUST follow this exact deployment path:
1. **Frontend Changes**: 
   - Test locally if needed using `npm run web`.
   - Run `git add .`, then `git commit -m "Your descriptive message"`.
   - Run `git push origin main`.
   - Vercel will automatically catch the commit and deploy the frontend in 1-2 minutes.
2. **Backend/Database Changes**:
   - If you need to change tables, create a migration file in `supabase/migrations/`.
   - Run `npx supabase db push` (Use the Database Password if prompted, or set `$env:SUPABASE_DB_PASSWORD`).
