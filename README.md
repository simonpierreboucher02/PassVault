# replit.md

## Overview

PassVault is a privacy-first password manager built by MinimalAuth.com that allows users to securely store and manage their login credentials. The application follows the MinimalAuth principle of requiring only username and password for registration, with a recovery key generated for account recovery. The system is designed with security as the top priority, featuring client-side encryption, secure authentication, and a modern web interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for robust form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Passport.js with local strategy and session-based auth
- **Password Security**: Node.js crypto module with scrypt for password hashing
- **Session Management**: Express sessions with configurable storage

### Database and Storage
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for production)
- **Development Storage**: In-memory storage implementation for development
- **Session Store**: Memory store for development, PostgreSQL store for production
- **Schema**: Users and credentials tables with proper foreign key relationships

### Security Features
- **Client-side Encryption**: AES-256 encryption for stored passwords using CryptoJS
- **Master Key Derivation**: SHA-256 hash of username + password combination
- **Password Hashing**: Scrypt with salt for server-side password storage
- **Recovery System**: One-time recovery key generation for account recovery
- **Session Security**: Secure session configuration with appropriate settings

### Password Management Features
- **Built-in Password Generator**: Configurable password generation with customizable options
- **Password Strength Analysis**: Real-time password strength evaluation
- **Credential Organization**: Category-based organization (Work, Social, Finance, etc.)
- **Search and Filtering**: Full-text search across credential names, usernames, and URLs

### Development and Build System
- **Development**: Hot module replacement with Vite dev server
- **Build Process**: Client builds to static assets, server bundles with esbuild
- **Type Checking**: Comprehensive TypeScript configuration across client/server/shared
- **Path Aliases**: Configured aliases for clean import statements

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible component foundation
- **Icons**: Lucide React for consistent iconography
- **Styling**: Tailwind CSS with PostCSS for styling pipeline
- **Crypto**: CryptoJS for client-side encryption operations
- **Form Validation**: Zod for schema validation
- **Date Handling**: date-fns for date manipulation

### Backend Dependencies
- **Authentication**: Passport.js with local strategy
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Session Storage**: connect-pg-simple for PostgreSQL session store
- **Password Security**: Node.js built-in crypto module

### Development Tools
- **Build**: Vite for frontend bundling, esbuild for server bundling
- **Database**: Drizzle Kit for schema management and migrations
- **TypeScript**: Full TypeScript support across the entire stack
- **Replit Integration**: Specialized plugins for Replit development environment

### Database Provider
- **Neon Database**: Serverless PostgreSQL for production deployment
- **Connection**: @neondatabase/serverless for optimized database connectivity

The application is architected as a full-stack TypeScript application with a clear separation between client and server code, shared type definitions, and a focus on security and user privacy throughout the system design.