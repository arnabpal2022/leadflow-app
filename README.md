
# Leadflow - A Buyer Lead Intake App

A mini-CRM for capturing, listing, and managing buyer leads, built with a modern Next.js and TypeScript stack. This project fulfills a comprehensive assignment focused on full-stack development best practices, including data validation, authentication, and transactional database operations.

**Live Demo:** [[Link of the Demo](https://leadflow-app-eight.vercel.app/)]
<img width="1910" height="926" alt="image" src="https://github.com/user-attachments/assets/bfab06b6-7b39-40e6-84d0-915eef74bbd5" />


## Features

-   **Lead Creation:** A detailed form with client and server-side validation to capture new buyer leads.
-   **Dynamic Lead Dashboard:** A server-side rendered, paginated list of all leads.
-   **URL-Synced Filters & Search:** Filter by city, property type, status, and timeline, with a debounced search for name, email, or phone. All search state is synced with the URL for shareability.
-   **Detailed Lead View & Edit:** A comprehensive view of each lead's data, with an inline edit form protected by ownership rules.
-   **Bulk CSV Import:** Transactional import of up to 200 leads at a time, with row-by-row validation and a detailed error summary.
-   **Filtered CSV Export:** Export the currently filtered and sorted list of leads to a CSV file.
-   **Secure Magic Link Authentication:** Passwordless login using NextAuth.js.
-   **Ownership & Permissions:** Users can only edit or delete leads they own.
-   **Concurrency Control:** Prevents lost updates by checking if a record was modified by someone else before saving.
-   **Audit Trail:** The last 5 changes for each lead are displayed on its detail page.
-   **Quality of Life:** Includes rate limiting on critical endpoints and a unit test for validation logic.

## Tech Stack

-   **Framework:** Next.js 14 (App Router)
-   **Language:** TypeScript
-   **Database:** libSQL (SQLite) with Drizzle ORM for type-safe queries and migrations.
-   **Authentication:** NextAuth.js (Magic Link / Email Provider)
-   **Validation:** Zod
-   **UI:** Tailwind CSS
-   **Forms:** React Hook Form
-   **Testing:** Vitest & React Testing Library

## Local Development Setup

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

-   Node.js (v18.17 or later)
-   npm or yarn
-   Git

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/buyer-leads-app.git
cd buyer-leads-app
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env.local` file by copying the example file:

```bash
cp .env.example .env.local
```

Now, open `.env.local` and fill in the required values. You'll need an SMTP server for magic links to work. Using a Gmail "App Password" is a quick way to get started.

```env
# Database URL (uses a local file by default)
DATABASE_URL="file:./sqlite.db"

# NextAuth.js Configuration
# Generate a secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-super-secret-key-here"

EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-gmail-app-password"
EMAIL_FROM="your-email@gmail.com"
```

### 5. Set Up the Database

Run the Drizzle Kit migrations to create the database schema, then seed it with initial sample data.

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
npm run db:seed             # if you need demo data
```

### 6. Run the Application

```bash
npm run dev
```
The application will be available at **[http://localhost:3000](http://localhost:3000)**.

## Design & Architecture Notes

-   **Validation:** Zod schemas are the single source of truth for data validation, used on both the server (API routes) and the client (React Hook Form). This ensures data integrity and a great user experience with instant feedback.

-   **SSR vs. Client:** The main buyer list (`/buyers`) is Server-Side Rendered (SSR) to ensure fast initial loads and good SEO. Filters and search are managed on the client with `useRouter` and `useSearchParams` to update the URL without full page reloads, providing a smooth, app-like feel. Forms and detail pages are client-rendered for interactivity.

-   **Ownership Enforcement:** All `PUT` and `DELETE` API endpoints for buyers first fetch the existing record. They then check if the `ownerId` on the record matches the ID of the authenticated user from the session. If they don't match (and the user is not an admin), a `403 Forbidden` error is returned.

-   **Data Model:** The `buyers` table holds the current state of a lead. The `buyer_history` table acts as an audit log, recording a JSON diff of every change. This provides a clear, immutable record of how a lead has progressed.

## What's Done vs. Skipped

### Completed Requirements
-   All "must-have" features from the assignment are implemented.
-   CRUD operations for buyer leads.
-   Server-side pagination, sorting, and filtering.
-   URL-synced state for filters and search.
-   Transactional CSV import with row-level error reporting.
-   Filtered CSV export.
-   Magic Link authentication and ownership-based permissions.
-   Zod validation on client and server.
-   Drizzle migrations.
-   Rate limiting, concurrency control, and a unit test.

### Nice-to-Haves Implemented
-   **Status Quick-Actions:** A quick-change status dropdown is available on the buyer detail page for faster workflow.
-   **Basic full-text search:** We can search names, emails, phone numbers etc.

### Skipped (and Why)
-   **Tag Typeahead:** For simplicity, tags are added via a simple text input. A typeahead would be a great UX improvement but was skipped to focus on the core requirements.
-   **Optimistic Edit:** Edits currently show a loading state and wait for the API response. Optimistic UI would improve perceived performance but adds significant complexity (managing rollback on failure), which was deemed out of scope for this assignment.
-   **File Upload:** The data model allows for an `attachmentUrl`, but the UI and backend logic for handling file uploads were not implemented to keep the focus on the primary data management flow.
