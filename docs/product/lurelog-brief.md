# LureLog product requirements

LureLog is a fishing lure collection and catch journal built with React, Express, MongoDB and TypeScript. Users organize their tackle, record catches against their own lures, and review statistics calculated from their records.

This document describes the product vision. The README documents current behavior and the deployment runbook records outstanding launch work.

1. Technology Stack
   Frontend

- React with Vite and TypeScript
- Tailwind CSS
- shadcn/ui for reusable UI components
- Lucide React for icons
- React Router for navigation
- TanStack Query for API requests, caching, and synchronization
- React Hook Form and Zod for forms and validation
- Axios or a typed fetch client
- Framer Motion (Motion) for subtle animations
- Recharts for dashboard statistics
- Responsive, mobile-first layouts
  Backend
- Node.js with TypeScript
- Express.js
- MongoDB with Mongoose
- RESTful API architecture
- Secure authentication using JWT in HTTP-only cookies
- bcrypt or argon2 for password hashing
- Zod for API request validation
- Multer for processing file uploads
- Cloudinary for storing uploaded images in production
- Helmet, CORS, rate limiting, and secure middleware
- Centralized error handling
  Development tools
- npm workspaces for monorepo management
- ESLint and Prettier
- Environment-based configuration
- Vitest and React Testing Library
- Supertest for API integration tests
- Docker Compose for local MongoDB
  Use the latest stable compatible versions of dependencies.

2. Application Concept
   LureLog is a personal fishing inventory and catch tracking system.

Users can:

1. Register and log into their accounts.
2. Create a personal collection of fishing lures.
3. Store detailed information about each lure.
4. View, edit, search, filter, and delete lures.
5. Add fish catches associated with a specific lure.
6. Upload photos of caught fish.
7. Track which lures are the most successful.
8. See statistics about their fishing activity.
9. View a personal fishing journal containing all their catches.
   Each user must only have access to their own lures, catches, and photos.
10. UI/UX Design Requirements
    Create a polished, professional interface inspired by modern outdoor adventure applications and premium SaaS dashboards.

The design should feel like a real commercial product, not a generic admin dashboard.
Visual direction

- Modern, minimal, premium aesthetic
- Outdoor/fishing-inspired visual identity
- Deep navy, forest green, teal, and neutral colors
- Light and dark modes
- Large, clear headings
- Rounded cards and modern spacing
- High-quality image presentation
- Subtle shadows, transitions, and micro-interactions
- Modern typography such as Inter or Geist
- Beautiful empty states with clear calls to action
- Skeleton loaders for asynchronous content
- Toast notifications for user feedback
  Responsive behavior
- Mobile-first design
- Bottom navigation or mobile-friendly navigation for small screens
- Sidebar navigation for desktop screens
- Responsive cards and image galleries
- Touch-friendly forms and buttons
- Mobile camera/photo uploads
- Accessible keyboard navigation and WCAG-conscious color contrast
  Avoid excessive animations or unnecessarily complex interfaces.

4. Authentication
   Implement complete user authentication.
   Features

- User registration
- User login
- User logout
- Persistent login session
- Protected routes
- Get current logged-in user
- Update user profile
- Change password
  User fields
- ID
- Name
- Email
- Password hash
- Avatar (optional)
- Created at
- Updated at
  Security
- Hash passwords securely
- Never expose password hashes
- Store authentication tokens in secure HTTP-only cookies
- Apply appropriate SameSite and CSRF protections
- Secure cookies in production
- Implement authorization middleware
- Rate-limit authentication endpoints
- Validate all inputs
- Prevent users from accessing another user's records

5. Fishing Lure Collection
   Users can maintain a personal inventory of fishing lures.
   Lure fields
   Required:

- Name / model
- Brand
- Size / length (millimeters)
- Lure type
  Optional:
- Weight (grams)
- Color / pattern
- Floating behavior (floating, sinking, suspending)
- Fishing technique
- Description / notes
- Lure image
- Purchase date
- Purchase price
  Supported lure types
- Crankbait
- Jerkbait
- Minnow
- Soft Plastic
- Spinner
- Spinnerbait
- Spoon
- Jig
- Topwater
- Swimbait
- Other
  Make lure types configurable or extendable rather than hardcoding them in multiple places.
  Lure collection page
  Display the user's lures in a modern responsive grid.

Each lure card should display:

- Lure image or attractive placeholder
- Brand
- Model/name
- Size
- Color
- Type
- Total catches
- Quick action to add a catch
  Functional requirements
- Add lure
- Edit lure
- Delete lure with confirmation
- View lure details
- Search by lure name or brand
- Filter by brand, type, and size
- Sort by name, most catches, and date added
- Display total number of lures
- Pagination or infinite scrolling where appropriate
  Lure details page
  Each lure should have its own dedicated details page.

Display:

- Large lure image
- Brand and model
- Technical specifications
- Notes
- Total recorded catches
- Number of fish species caught
- Largest recorded catch
- Catch history with photos
- Prominent "Add Catch" button
  When a user adds a catch from this page, automatically associate it with the current lure.

6. Fish Catch Tracking
   Users can record fish caught using their saved lures.

Every catch must belong to:

- An authenticated user
- One lure owned by that user
  Catch fields
  Required:
- Fish species
- Lure reference
- Catch date
  Optional:
- Fish photo
- Fish length (cm)
- Fish weight (kg)
- Fishing location (free-text)
- Notes
- Water conditions
- Weather description
- Time of catch
  Fish species
  Allow users to select from predefined common fish species or enter custom species names.

Example species:

- Northern Pike
- European Perch
- Zander
- Trout
- Bass
- Catfish
- Asp
- Chub
- Other
  Do not restrict the system exclusively to these species.
  Catch functionality
- Add catch to a lure
- Upload fish photo
- Preview photo before saving
- Edit catch details
- Delete catch with confirmation
- View full catch details
- Browse catches belonging to a lure
- View catches from all lures in one journal
- Filter catches by species, lure, and date
- Sort catches by date, length, and weight
  Allow multiple catches to be attached to the same lure.

A catch photo is optional, but the upload experience should be prominent and user-friendly. 7. Image Uploads
Implement real image upload functionality.

Support:

- JPEG
- PNG
- WebP
  Requirements:
- Drag-and-drop upload
- File picker
- Camera upload on supported mobile devices
- Image preview
- File type validation using actual file content, not just extensions
- Maximum upload size of 5 MB
- Secure backend upload validation
- Image optimization and resizing where appropriate
- Clear loading states
- Upload error handling
  Store image files in Cloudinary for production, and store only relevant image metadata and references in MongoDB.

Do not store base64 image content in MongoDB.

Provide a configurable local development storage adapter so the application can work without Cloudinary credentials.

When catches or lures are deleted, clean up their related images safely, ensuring that one user's action cannot delete another user's images. 8. Dashboard
Create a beautiful dashboard that users see after logging in.
Summary cards

- Total lures
- Total catches
- Unique fish species caught
- Most successful lure
  Dashboard sections
  Recent catches

Display recent catches with:

- Fish photos
- Species
- Lure used
- Date
- Length and weight when recorded
  Top performing lures

Display the top 5 lures ranked by total recorded catches.

Catch activity chart

Display a graph of recorded catches over time.

Support monthly or yearly viewing where useful.

Species breakdown

Visualize catches by fish species.

Quick actions

- Add new lure
- Log new catch
- View collection
- Open fishing journal
  Include compelling empty states for new users without data.

9. Fishing Journal
   Create a dedicated page showing all catches logged by the current user.

Support:

- Gallery view with fish photos
- List view
- Search by species
- Filter by lure
- Date range filters
- Sorting
- Catch details modal or page
- Edit and delete actions
  Each catch entry should clearly display the lure used and provide a link to that lure's details.

The journal should feel like a personal fishing diary rather than a plain database table. 10. Application Pages
Implement at least the following routes:
Public

- / — Landing page
- /login — Login
- /register — Registration
  Protected
- /dashboard — Dashboard
- /lures — Lure collection
- /lures/new — Add lure
- /lures/:id — Lure details
- /lures/:id/edit — Edit lure
- /lures/:id/catches/new — Add catch for a specific lure
- /catches — Fishing journal
- /catches/new — Add catch with lure selection
- /catches/:id — Catch details
- /catches/:id/edit — Edit catch
- /profile — Profile and account settings
  Also implement:
- A proper 404 page
- Error boundaries
- Loading states
- Empty states

11. Database Architecture
    Design MongoDB/Mongoose models using proper relationships, timestamps, indexes, and validation.
    User
    {
    _id: ObjectId,
    name: string,
    email: string,
    passwordHash: string,
    avatar?: ImageReference,
    createdAt: Date,
    updatedAt: Date
    }
    Lure
    {
    _id: ObjectId,
    userId: ObjectId,
    name: string,
    brand: string,
    type: string,
    lengthMm: number,
    weightGrams?: number,
    color?: string,
    buoyancy?: string,
    technique?: string,
    description?: string,
    image?: ImageReference,
    purchaseDate?: Date,
    purchasePrice?: number,
    createdAt: Date,
    updatedAt: Date
    }
    Catch
    {
    _id: ObjectId,
    userId: ObjectId,
    lureId: ObjectId,
    species: string,
    caughtAt: Date,
    lengthCm?: number,
    weightKg?: number,
    location?: string,
    notes?: string,
    waterConditions?: string,
    weather?: string,
    photo?: ImageReference,
    createdAt: Date,
    updatedAt: Date
    }
    Create an appropriate reusable image reference structure containing storage provider, file identifier, and URL or storage path.

Important:

- Ensure each lure belongs to exactly one user.
- Ensure each catch references a lure belonging to the same user.
- Validate MongoDB ObjectIds.
- Use indexed queries for user-owned collections.
- Prevent cross-user data leakage.
- Handle deletion of lures with associated catches safely.
- Define and implement an explicit cascade deletion policy, including photo cleanup.

12. Backend REST API
    Implement versioned REST endpoints.
    Authentication

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- PATCH /api/v1/auth/password
  Users
- GET /api/v1/users/me
- PATCH /api/v1/users/me
  Lures
- GET /api/v1/lures
- POST /api/v1/lures
- GET /api/v1/lures/:id
- PATCH /api/v1/lures/:id
- DELETE /api/v1/lures/:id
  Catches
- GET /api/v1/catches
- POST /api/v1/catches
- GET /api/v1/catches/:id
- PATCH /api/v1/catches/:id
- DELETE /api/v1/catches/:id
- GET /api/v1/lures/:id/catches
  Dashboard
- GET /api/v1/dashboard/stats
  Uploads
  Implement suitable secure image upload endpoints or multipart upload handling for lures and catches.

API requirements:

- RESTful response conventions
- Consistent error response structure
- Proper HTTP status codes
- Validated request payloads
- Ownership checks for all protected resources
- Pagination, search, sorting, and filtering
- Safe aggregation queries for dashboard statistics
- Upload security and rate limiting
  Never trust a client-supplied userId. Determine ownership from the authenticated session.

13. Suggested Project Structure
    Use a clean monorepo:
    lurelog/
    ├── apps/
    │ ├── client/
    │ │ ├── src/
    │ │ │ ├── components/
    │ │ │ ├── features/
    │ │ │ │ ├── auth/
    │ │ │ │ ├── lures/
    │ │ │ │ ├── catches/
    │ │ │ │ └── dashboard/
    │ │ │ ├── hooks/
    │ │ │ ├── layouts/
    │ │ │ ├── lib/
    │ │ │ ├── pages/
    │ │ │ ├── routes/
    │ │ │ ├── styles/
    │ │ │ └── main.tsx
    │ │ └── package.json
    │ │
    │ └── server/
    │ ├── src/
    │ │ ├── config/
    │ │ ├── controllers/
    │ │ ├── middleware/
    │ │ ├── models/
    │ │ ├── routes/
    │ │ ├── services/
    │ │ ├── validators/
    │ │ ├── utils/
    │ │ ├── app.ts
    │ │ └── server.ts
    │ └── package.json
    │
    ├── packages/
    │ └── shared/
    │ └── src/
    │ ├── schemas/
    │ └── types/
    │
    ├── docker-compose.yml
    ├── .env.example
    ├── package.json
    └── README.md
    Share types and validation schemas where appropriate without exposing backend-only code or secrets to the frontend.
14. Landing Page
    Create a professional public landing page introducing the application.

Include:

- Navigation with logo and login/register buttons
- Hero section with a compelling headline
- Short explanation of the product
- App dashboard or lure collection preview
- Feature sections
- Mobile responsive design
- Call-to-action buttons
- Footer
  Suggested headline:

"Every lure has a story. Track yours."

Suggested subtitle:

"Organize your fishing lures, record every catch, and discover which lures bring you the most success."

Make this page visually compelling and consistent with the authenticated application. 15. Performance and Security
Implement:

- Lazy-loaded frontend routes
- Efficient MongoDB queries
- Appropriate database indexes
- Client-side image previews
- Optimized image delivery
- Server-side pagination
- Proper caching and invalidation
- Input sanitization where necessary
- Rate limiting
- Secure file uploads
- Environment variable validation
- No hardcoded secrets
- Robust error handling
- CORS restricted to configured origins
- CSRF protections for cookie-based authentication
- Proper authorization tests

16. Testing
    Write meaningful tests for critical functionality.
    Backend tests

- Registration and login
- Authentication guards
- Lure CRUD
- Catch CRUD
- Ownership and authorization
- Cross-user access prevention
- Invalid file uploads
- Validation errors
- Lure deletion with related catches
  Frontend tests
- Authentication forms
- Add lure form
- Add catch form
- Form validation
- Filtering and search
- Loading and error states
  Avoid writing placeholder tests that do not verify real behavior.

17. Developer Experience
    Provide:

- A complete README
- Clear setup instructions
- .env.example files
- MongoDB connection configuration
- Docker Compose for MongoDB
- Database seed script with realistic example fishing lures and catches
- Development scripts
- Build scripts
- Lint and test scripts
- Production deployment instructions
  The project must be runnable locally using documented commands.

Cloudinary should be optional for local development because a local image storage adapter must be supported. 18. Acceptance Criteria
The project is complete only when:

- A user can register an account and log in.
- The user remains authenticated across page refreshes.
- A user can add a lure with brand, name, size, and type.
- Added lures appear immediately in the user's collection.
- A user can edit or delete their lures.
- A user can open a lure and view its details.
- A user can add multiple fish catches to the same lure.
- A user can upload and view a real fish photo.
- Uploaded photos persist after page reload.
- A user can edit and delete catches.
- A user can see all catches in their fishing journal.
- Lure catch totals are calculated correctly.
- Dashboard statistics reflect real stored data.
- Two different users cannot access each other's resources.
- All important pages work on mobile and desktop.
- Forms have appropriate validation.
- The application can start locally without paid external services.
- The app passes lint, type checking, and implemented tests.
- Production builds complete successfully.
- The README contains working setup instructions.
