# Email Notification on Complaint Resolution — Implementation Steps

- [x] Step 1: Install `nodemailer` + `@types/nodemailer`
- [x] Step 2: Create Next.js API route `app/api/send-email/route.ts`
- [x] Step 3: Create client-side helper `lib/email-service.ts`
- [x] Step 4: Update `app/worker/page.tsx` — send email on `handleComplete`
- [x] Step 5: Update `app/admin/page.tsx` — send email on `updateStatus` → resolved
- [x] Step 6: Create `.env.local.example` with SMTP placeholders
- [x] Step 7: Verify build (`tsc --noEmit` passed with 0 errors)

