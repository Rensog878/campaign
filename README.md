# WhatsApp Campaign Portal

A private dashboard for sending scheduled WhatsApp promotions to customers using Meta's WhatsApp Cloud API.

- **Login**: one account (or more) created by the seed script. There is no public sign-up.
- **Message log**: every message with its status (sent, delivered, read, failed), plus filters, search and CSV export.
- **Campaigns**: weekly days and time (for example Tue and Fri at 10:00), audience by tag, and **customers per batch + minutes between batches**.
- **Templates**: Marketing, Utility and Authentication, with a live WhatsApp preview, variables (name, first name, phone, fixed text), header, footer and buttons. Saving submits the template to Meta. The next batch always uses the latest approved version.
- **Customers**: CSV import, tags, and opt-out. Customers who reply STOP are opted out automatically.
- **Demo mode**: if the WhatsApp variables are empty, sends are simulated so the portal can be tried safely.

Stack: Next.js 16, Prisma, Postgres (Neon), Tailwind CSS 4.

## Run locally

```bash
cp .env.example .env        # fill in DATABASE_URL, AUTH_SECRET, ADMIN_*, CRON_SECRET
npm install
npm run db:push             # create tables
npm run seed                # create the login (add -- --demo for 1,000 sample customers)
npm run dev
```

## Deploy to Vercel

1. Push this folder to GitHub and import it in Vercel.
2. **Storage → Create → Neon Postgres** and connect it to the project. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. Add the other variables from `.env.example` in **Settings → Environment Variables**: `AUTH_SECRET`, `CRON_SECRET`, `BUSINESS_NAME`, and the WhatsApp variables once they're ready.
4. Deploy. Then, from your computer with the production `DATABASE_URL` in `.env`, run:
   `npm run db:push && npm run seed` (with the client's `ADMIN_EMAIL` and `ADMIN_PASSWORD`).
5. **Scheduler**: something must call `/api/cron` every 5 minutes.
   - Vercel **Hobby** (free) only allows daily crons. Use [cron-job.org](https://cron-job.org) (free) to call
     `https://YOUR-APP.vercel.app/api/cron?key=YOUR_CRON_SECRET` every 5 minutes.
   - Vercel **Pro**: add `vercel.json` with
     `{ "crons": [{ "path": "/api/cron", "schedule": "*/5 * * * *" }] }`. Vercel sends the `CRON_SECRET` automatically.

## Connect WhatsApp (Meta)

1. Meta Business Suite → verify the business. developers.facebook.com → create a **Business** app → add **WhatsApp**.
2. Add the client's phone number in WhatsApp Manager. The number must not be in use on the WhatsApp app.
3. Business Settings → **System users** → create an admin user → generate a **permanent token** with
   `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_APP_ID` and `META_APP_SECRET`.
5. App → WhatsApp → Configuration → **Webhook**: callback URL `https://YOUR-APP.vercel.app/api/webhook`, verify token = `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   Subscribe to `messages` and `message_template_status_update`.
6. In the portal: **Templates → Sync with Meta** to import existing templates.

## Good to know

- Marketing messages cost money per message (charged by Meta), and Meta may limit how many marketing messages one person receives. Two per week is reasonable.
- A new number starts with a limit of 250 business-initiated conversations a day, which rises as quality stays high. Use batch pacing (for example 100 every 10 minutes) while the number warms up.
- Editing an approved template sends it back to Meta for review, usually within minutes. Campaigns wait (status "Waiting for approval") and resume automatically.
- Authentication (OTP) templates can be created and managed here, but they're sent by the client's website or app, not by campaigns.
