# 🧠 AI Context & Memory File (Delivery App)

## 📌 Project Overview
This is a Delivery Application (CulinaShare) built with:
- **Frontend**: React Native (Expo Router v3), NativeWind v4 (Tailwind CSS for React Native)
- **Backend/DB**: Supabase (PostgreSQL, Auth, REST API)
- **Deployment**: Vercel (as a Single Page Application `spa` web build)
- **State Management**: React Hooks + Supabase Realtime (optional)

## 🏗️ Architecture & Navigation
- Uses Expo Router with grouping:
  - `/(auth)/login.tsx` -> Login Screen.
  - `/(client)/home.tsx` -> Main Menu for clients.
  - `/(client)/cart.tsx` -> Cart for clients.
  - `/(admin)/dashboard.tsx` -> Admin statistics and control panel.
  - `/(admin)/orders.tsx` -> Live orders management.
- **Auth Guard**: `_layout.tsx` enforces authentication. If no session exists, it forces redirect to `/(auth)/login`.

## 🗄️ Database Schema (Supabase)
The project uses the following tables:
1. `profiles`: id (uuid), role (text: client/admin), name, phone.
2. `categories`: id, name, icon.
3. `items`: id, category_id, name, description, price, image_url, is_available.
4. `orders`: id, user_id, status (pending, accepted, delivered), total_amount, delivery_address.
5. `order_items`: id, order_id, item_id, quantity, price.

## 🔐 For Future AI Assistants
If you are an AI agent picking up this project for a new session:
1. **Understand the stack**: NativeWind v4 requires `global.css` and `babel.config.js` preset. The web output is configured as `single` SPA in `app.json`.
2. **Backend Access**: Do NOT assume you have database access. You must ask the user to provide their:
   - `Database Password`
   - `Supabase Personal Access Token (MCP)`
   (The user has these saved locally on their Desktop in `DeliveryApp_Secrets.md`).
3. **Execution**: Once the user provides the MCP token, use the Supabase MCP Server or Supabase CLI to execute migrations or fetch schemas.
4. **Deployments**: The Github repo is Public. Pushing to the `main` branch automatically triggers a Vercel deployment. Do NOT push actual secrets or `.env` files to this repository.

## 🚀 Current State
- The UI is fully built.
- Supabase is linked.
- The DB schema has been pushed via `supabase db push`.
- The Admin account (`admin@app.com` / `admin123`) is active.
