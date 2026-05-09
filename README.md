# CHAY SOLE

Internal admin tool for the CHAY SOLE brand. A library of ad creatives (image/video/copy assets) where each creative can be tagged with products from CHAY SOLE DROPS.

## Stack

- Next.js 14 (App Router, TypeScript strict)
- - Supabase (auth, database, storage)
  - - Tailwind CSS
    - - Shopify Storefront API
     
      - ## Setup
     
      - 1. Clone the repo
        2. 2. Copy `.env.local.example` to `.env.local` and fill in values
           3. 3. Run `npm install`
              4. 4. Run `npm run dev`
                
                 5. ## Supabase Setup
                
                 6. 1. Create a new Supabase project
                    2. 2. Run `supabase/schema.sql` in the SQL editor
                       3. 3. Create a storage bucket named `creatives` (public)
                          4. 4. Create an auth user with your email
                             5. 5. Ensure your email is in the `admins` table
                               
                                6. ## Shopify Setup (optional)
                               
                                7. Without Shopify env vars, the app uses mock product data.
                               
                                8. 1. Install the Shopify Headless sales channel
                                   2. 2. Create a Storefront access token
                                      3. 3. Add `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_STOREFRONT_API_VERSION` to env vars
                                         4. 4. Click "Sync products from Shopify" in the app
                                           
                                            5. ## Deployment
                                           
                                            6. Deploy to Vercel. Add all env vars from `.env.local.example` to the Vercel project settings.
