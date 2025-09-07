# Jira Time Tracker

## Overview

This is a full-stack time tracking application that bridges FileMaker client data with Jira project management. The system allows users to track time entries against Jira issues while maintaining relationships with FileMaker clients. Built with React/TypeScript frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing  
- **UI Framework**: Radix UI components with Tailwind CSS using shadcn/ui design system
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Styling**: Tailwind CSS with CSS variables for theming support

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication (basic implementation)
- **API Design**: RESTful endpoints following standard HTTP conventions
- **Development**: TypeScript with ESM modules and tsx for development server

### Database Design
The system uses a PostgreSQL database with the following core entities:
- **Users**: Store authentication credentials and integration settings (Jira/FileMaker)
- **Clients**: FileMaker client records with contact information
- **Projects**: Jira project mappings with keys and metadata  
- **Client-Project Mappings**: Many-to-many relationship between clients and projects
- **Time Entries**: Core time tracking records linking users, clients, projects, and Jira issues
- **Jira Issues**: Cached issue data for offline functionality

### External Service Integrations
- **Jira Integration**: REST API client for issue search, project retrieval, and worklog management
- **FileMaker Integration**: Data API client for client record synchronization
- **Neon Database**: Serverless PostgreSQL hosting for scalable data storage

### Key Architectural Decisions

**Separation of Concerns**: Clean separation between client data (FileMaker) and project data (Jira) with explicit mapping layer to handle relationships.

**Type Safety**: Full TypeScript implementation with Zod schemas for runtime validation and Drizzle for compile-time database type safety.

**Caching Strategy**: TanStack Query provides intelligent caching for API responses while maintaining fresh data for real-time timer functionality.

**Responsive Design**: Mobile-first approach with collapsible sidebar and responsive layouts for cross-device compatibility.

**Development Experience**: Vite for fast hot reloading, ESBuild for production builds, and comprehensive TypeScript configuration for developer productivity.

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting via @neondatabase/serverless driver
- **Jira Cloud**: REST API integration for project and issue management
- **FileMaker Server**: Data API for client record management

### Frontend Libraries
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query for server state and React hooks for local state
- **Form Management**: React Hook Form with Hookform Resolvers for validation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Backend Dependencies
- **Database**: Drizzle ORM with Drizzle Kit for migrations
- **Validation**: Zod for schema validation and type inference
- **Development**: tsx for TypeScript execution and Vite plugins for enhanced development