# Architecture Overview

## 1. Overview

This repository contains a full-stack web application for managing workplace safety and health (BZR - Bezbednost i Zdravlje na Radu). The system helps companies manage documentation, risk assessments, job positions, employees, and training related to workplace safety. It incorporates AI features for document analysis and providing assistance to users.

The application follows a modern client-server architecture with:
- React-based frontend with a component library built on shadcn/ui
- Express.js backend with RESTful API endpoints
- PostgreSQL database with Supabase integration
- AI capabilities using multiple providers (Anthropic, Gemini, OpenRouter)
- File storage using Wasabi (S3-compatible)

## 2. System Architecture

The system follows a layered architecture:

1. **Presentation Layer**: React frontend with Tailwind CSS and shadcn/ui components
2. **API Layer**: Express.js REST API endpoints
3. **Service Layer**: Business logic in specialized service classes
4. **Data Access Layer**: Database access via Drizzle ORM and direct Supabase client
5. **External Services Layer**: Integration with AI providers, email services, and file storage

The application employs a modular structure with clear separation of concerns:
- `client/` - Frontend React application
- `server/` - Backend Express.js application
- `shared/` - Shared types and schemas used by both frontend and backend
- `migrations/` - Database migrations

## 3. Key Components

### 3.1 Frontend

- **Framework**: React with TypeScript
- **Routing**: wouter (lightweight alternative to react-router)
- **State Management**: React Query for server state, React Context for local state
- **UI Components**: shadcn/ui (built on Radix UI) with Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Theming**: Supports light/dark mode with CSS variables

Key frontend features:
- Dashboard with analytics
- Document management interfaces
- AI assistant chat interface
- User and role management
- Onboarding tour for new users

### 3.2 Backend

- **Framework**: Express.js with TypeScript
- **API Structure**: RESTful endpoints organized by resource type
- **Authentication**: Session-based authentication with Supabase integration
- **File Processing**: Support for multiple document formats (PDF, DOC, DOCX, XLS, etc.)
- **Service Layer**: Specialized services for AI, document processing, storage, etc.

Key backend services:
- `AIAgentService`: Processes user queries using AI models
- `DocumentExtractorService`: Extracts text from various document formats
- `EmbeddingsService`: Generates vector embeddings for text
- `VectorStorageService`: Stores and retrieves document vectors for semantic search
- `WasabiStorageService`: Manages file storage in S3-compatible storage
- `EmailService`: Sends transactional emails with fallback options

### 3.3 Database

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with zod schema validation
- **Vector Database**: Supabase with pgvector extension for semantic search
- **Schema**: Defines entities such as companies, users, documents, job positions, risks, etc.

Main database tables include:
- `companies` - Company information
- `users` - User accounts
- `job_positions` - Job positions within companies
- `job_descriptions` - Detailed descriptions of job positions
- `risks` - Identified workplace risks
- `safety_measures` - Measures to mitigate risks
- `employee_trainings` - Training records for employees
- `documents` - Stored documents including vectors for semantic search

### 3.4 AI Integration

The system integrates with multiple AI providers to ensure reliability and options for different capabilities:
- Anthropic Claude (via SDK)
- Google Gemini (API integration)
- OpenRouter (for access to multiple models)

AI features include:
- Document analysis and information extraction
- Question answering based on knowledge base
- Generation of safety documents and reports
- Text extraction from OCR and document processing

### 3.5 File Storage

- **Primary Storage**: Wasabi (S3-compatible)
- **Buckets**:
  - `bzr-knowledge-base-bucket`: Stores reference documents and knowledge base
  - `bzr-user-documents-bucket`: Stores user-specific documents

## 4. Data Flow

### 4.1 Document Processing Flow

1. User uploads document through the UI
2. Document is stored in Wasabi S3
3. Document is processed to extract text content
4. Content is vectorized using the EmbeddingsService
5. Vectors are stored in the vector database for semantic search
6. Structured data extracted from document is stored in relevant database tables

### 4.2 AI Assistant Flow

1. User submits query in the AI Assistant interface
2. Backend searches vector database for relevant context using semantic similarity
3. Context and query are sent to AI provider (with fallback options)
4. AI response is returned to user
5. Optionally, responses can be used to generate blog posts or knowledge base entries

### 4.3 User Authentication Flow

1. User signs up/logs in via the authentication page
2. Authentication is handled through Supabase Auth
3. Session is maintained with cookies
4. Role-based access controls restrict access to appropriate features

## 5. External Dependencies

### 5.1 Cloud Services

- **Supabase**: Database, authentication, and vector storage
- **Wasabi**: S3-compatible file storage
- **OpenRouter/Anthropic/Gemini**: AI providers

### 5.2 Major Libraries

- **Frontend**:
  - React and React DOM
  - Tailwind CSS for styling
  - shadcn/ui component library (based on Radix UI)
  - React Query for data fetching
  - React Hook Form for forms
  - Zod for validation

- **Backend**:
  - Express.js for the server
  - Drizzle ORM for database access
  - Multer for file uploads
  - AWS SDK for S3 integration
  - Various document processing libraries (pdf-parse, etc.)

## 6. Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Build Process**: Vite builds the frontend, esbuild bundles the backend
- **Runtime Environment**: Node.js 20
- **Database**: PostgreSQL 16 (provided by Replit)
- **Environment Variables**: Configuration for external services is managed through environment variables
- **Deployment Target**: Autoscaled deployment with custom build and run commands

The deployment process includes:
1. Building the frontend with Vite
2. Bundling the server code with esbuild
3. Starting the application with the production Node.js server

Development mode uses live reloading with:
- Vite dev server for frontend
- tsx for running TypeScript server code directly

## 7. Security Considerations

- Authentication is handled through Supabase with secure session management
- File uploads are validated for size and type
- Request rate limiting for AI resources
- Role-based access control for administrative functions
- Secure file storage with proper access controls
- Environment variables for sensitive configuration