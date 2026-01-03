# Bunyan CRM - Construction Management System

A comprehensive progress-based pricing and billing system built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Multi-level Data Hierarchy**: Areas → Projects → Buildings → Services (BOQ)
- **Progress-Based Pricing**: Automatic calculation of due amounts based on completion percentages
- **Company Management**: Client profiles with contact information
- **Automated Invoicing**: Generate invoices based on progress milestones
- **Real-time Calculations**: Dynamic calculation of current payable and unbilled amounts
- **Authentication**: Secure login and registration using Supabase Auth
- **RTL Support**: Ready for Arabic and other RTL languages
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up your Supabase project:

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor in your Supabase dashboard
   - Run the migration file: `supabase/migrations/002_simplified_schema.sql`

3. Configure environment variables:

   - Copy `env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The system uses the following main tables:

- **areas**: Geographical work zones
- **companies**: Client profiles with contact information
- **projects**: Links projects to areas and companies
- **buildings**: Sub-units within projects (e.g., Building A, B, C)
- **services**: Service types (BOQ) with unit prices and progress tracking
- **invoices**: Generated payment requests
- **invoice_items**: Detailed line items for invoices

## Core Workflow

1. **Setup**: Create Areas, then Companies, then Projects
2. **Planning**: Add Buildings to projects and define Services (BOQ) with unit prices
3. **Execution**: Update progress percentages for each service
4. **Billing**: System automatically calculates unbilled amounts
5. **Invoicing**: Generate invoices for completed work increments

## Calculation Engine

The system uses the following formula for progress-based billing:

```
Earned Value = (Unit Price × Quantity) × (New Progress - Old Progress) / 100
```

- **Current Payable**: Total value based on current progress
- **Unbilled Amount**: Value of work completed since last invoice

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard overview
│   ├── areas/              # Area management
│   ├── companies/          # Company management
│   ├── projects/           # Project list and detail
│   ├── buildings/          # Building BOQ and progress tracking
│   ├── invoices/           # Invoice list and preview
│   ├── login/              # Login page
│   └── register/          # Registration page
├── components/             # React components
│   ├── shared/             # Reusable UI components
│   ├── areas/              # Area-specific components
│   ├── companies/          # Company-specific components
│   ├── projects/           # Project-specific components
│   ├── buildings/          # Building and BOQ components
│   └── invoices/           # Invoice components
├── hooks/                  # Custom React hooks
│   ├── useAreas.ts
│   ├── useCompanies.ts
│   └── useProjects.ts
├── lib/                    # Utility functions
│   ├── calculations.ts     # Progress calculation logic
│   ├── utils.ts            # RTL helpers and formatting
│   └── supabaseClient.ts   # Supabase client
└── types/                  # TypeScript type definitions
    └── database.ts         # Database types
```

## Key Components

### BOQTable
The core component for tracking service progress. Features:
- Editable progress percentage fields
- Real-time calculation of current payable amounts
- Display of unbilled amounts
- Automatic updates to database

### InvoiceGenerator
Generates invoices based on unbilled progress:
- Filters services with unbilled progress
- Calculates total amount
- Creates invoice and invoice items
- Updates last_invoiced_progress for services

### InvoicePreview
Professional RTL-ready invoice preview:
- Company and project information
- Itemized service details
- Progress percentage changes
- Print-ready format

## Authentication

The system includes:
- User registration with email/password
- User login
- Protected routes (all pages except login/register)
- Session management with middleware
- Automatic redirects for unauthenticated users

## Development

### Adding a New Service to a Building

1. Navigate to a project
2. Click on a building
3. Click "Add Service"
4. Enter description, unit price, and quantity
5. Update progress percentage as work is completed

### Generating an Invoice

1. Navigate to a project detail page
2. Scroll to "Invoice Generator"
3. Review unbilled services and amounts
4. Click "Generate Invoice"
5. View the invoice in the Invoices page

## License

MIT
