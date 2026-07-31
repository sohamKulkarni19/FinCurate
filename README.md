# FinCurate 2.0 ??

[![Live Demo](https://img.shields.io/badge/Live-Demo-2dd4bf?style=for-the-badge&logo=vercel)](https://your-deployment-url-here.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

FinCurate 2.0 is a modern, high-performance mutual fund curation and analysis dashboard designed to help Indian retail investors make data-driven decisions. It fetches and analyzes real-time and historical NAV data from the [MFapi.in](https://www.mfapi.in/) open API.

## ? Features

- **Blazing Fast Autocomplete Search**: Instantly query a master database of over 37,000 mutual funds.
- **Apples-to-Apples Comparisons**: Shortlist multiple funds and plot their normalized "Growth of ?10,000" on a shared, interactive timeline.
- **Advanced SIP Analytics**: Discover the true historical performance of a fund by calculating the average, minimum, and maximum XIRR across every single monthly rolling window (1Y, 3Y, 5Y, 10Y).
- **Lumpsum CAGR Tracking**: Visualize point-to-point rolling CAGR for one-time investments.
- **Client-Side Persistence**: Your shortlisted funds are persisted seamlessly using Zustand and local storage.
- **Lazy Data Sync**: The system intelligently caches massive historical NAV datasets in a serverless Prisma Postgres database, ensuring instant load times on subsequent visits.
- **Premium UI/UX**: Built with a sleek, dark glassmorphism aesthetic using Tailwind CSS and interactive charts powered by Recharts.

## ?? Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **State Management**: Zustand
- **Database**: Prisma Postgres
- **ORM**: Prisma Client v7 (with Edge-compatible @prisma/adapter-pg)
- **Charting**: Recharts
- **Math/Date Utilities**: date-fns, custom XIRR / CAGR algorithms

## ?? Getting Started Locally

### Prerequisites
- Node.js 18+
- A Prisma Postgres database URL (or a local PostgreSQL instance)

### 1. Clone the repository
\\\ash
git clone https://github.com/yourusername/fincurate-2.0.git
cd fincurate-2.0
\\\

### 2. Install dependencies
\\\ash
npm install
\\\

### 3. Setup Environment Variables
Create a .env file in the root directory and add your PostgreSQL connection string:
\\\env
DATABASE_URL="postgres://your_user:your_password@your_host/your_db?sslmode=require"
\\\

### 4. Push the Database Schema
Sync the Prisma schema to your database:
\\\ash
npx prisma migrate dev --name init
\\\

### 5. Seed the Database
Populate the database with the master list of all Indian mutual funds:
\\\ash
npx tsx scripts/sync-master.ts
\\\

### 6. Run the Development Server
\\\ash
npm run dev
\\\
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ?? Deployment

This project is optimized for deployment on Vercel. 

1. Ensure your DATABASE_URL is configured in the Vercel Project Settings.
2. The Prisma Postgres edge adapter (@prisma/adapter-pg) ensures database connections scale flawlessly inside serverless functions.
3. Push to your master branch to trigger an automatic deployment!

## ?? License
MIT License
