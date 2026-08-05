# FinCurate 2.0 ??

[![Live Demo](https://img.shields.io/badge/Live-Demo-2dd4bf?style=for-the-badge&logo=vercel)](https://fincurate-sand.vercel.app/)
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

