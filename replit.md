# EccoServ - Well Service Management System

## Overview

EccoServ is a comprehensive well service management system that connects clients who own wells with service providers who maintain them. The application facilitates scheduling, tracking, and managing maintenance visits for residential, industrial, and agricultural wells. The system supports three user types: clients (well owners), providers (maintenance technicians), and administrators who oversee the entire operation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **Routing**: Wouter for client-side routing with role-based route protection
- **State Management**: TanStack Query for server state management and React Context for authentication
- **Form Handling**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based endpoints
- **File Uploads**: Multer middleware for handling image uploads (visit photos)
- **Error Handling**: Centralized error handling with status codes and JSON responses
- **Development**: Hot reload with Vite integration in development mode

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM ready for production deployment
- **Schema Management**: Drizzle Kit for migrations and schema changes
- **Connection**: DATABASE_URL environment variable configured for easy .env integration
- **Storage Strategy**: In-memory storage with interface for seamless database migration (DatabaseStorage class available in server/storage.ts)
- **Migration Ready**: `npm run db:push` command available for schema deployment

### Authentication and Authorization
- **Strategy**: Simple email/password authentication with user type differentiation
- **Session Management**: Client-side storage using localStorage for user persistence
- **Authorization**: Role-based access control with three user types (client, provider, admin)
- **Route Protection**: Frontend route guards that redirect unauthorized users

### Data Models
- **Users**: Base user entity with email, password, name, and user type
- **Clients**: Extended user profile with address and phone for well owners
- **Wells**: Client-owned assets with location, type, and status tracking
- **Providers**: Service technicians with specialties and contact information
- **Visits**: Service appointments linking providers to wells with observations, photos, and status
- **Invoices**: Financial records linking visits to billing information with status tracking

### Application Pages
- **Landing Page** (`/`): Modern homepage with user type selection and feature overview
- **Registration Page** (`/register`): Multi-step registration for clients and providers with conditional fields
- **Login Page** (`/login`): Authentication with role-based dashboard redirection
- **Client Dashboard**: Well management, visit history, and invoice viewing
- **Provider Dashboard**: Visit scheduling, invoice generation, and service tracking
- **Admin Dashboard**: System overview with comprehensive reporting and user management

### External Dependencies
- **Database**: Neon Database (PostgreSQL serverless)
- **UI Components**: Radix UI primitives for accessible component foundation
- **Validation**: Zod for runtime type checking and form validation
- **Date Handling**: date-fns for date formatting and manipulation
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Development Tools**: Replit integration for development environment support