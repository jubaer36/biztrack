# BizTrack - Business Management Application

A full-stack business management application with Next.js frontend and Express.js backend, using Supabase for authentication.

[Demo Video Link](https://youtu.be/STNoXqq8kQM?si=4kuPF8W7zIzb8riI)


## Features

- **User Authentication**: Register, login, logout, and password reset  
- **Secure Backend**: Express.js API with Supabase authentication  
- **Modern Frontend**: Next.js 16 with TypeScript and Tailwind CSS  
- **Dashboard**: User dashboard with an overview of the business and other feature options for analysis 
- **Real-time Revenue & Expense Tracking**: Instantly monitor cash flow and financial performance  
- **AI Financial Analysis & Risk Alerts**: Get intelligent insights and automatic risk notifications  
- **Cash Flow Management & AI Assistant**: Automate financial decisions and optimize liquidity  
- **Customer Insights & Retention**: Understand customers deeply with AI-driven segmentation and churn prevention  
- **Intelligent Data Mapping & Automation**: Transform messy data into structured databases with zero setup  
- **AI Demand Forecasting**: Predict product demand using history, holidays, and weather trends  


## Tech Stack

### Frontend
- Next.js 16
- TypeScript
- Tailwind CSS
- Shadcn
- React Context for state management

### Backend
- Express.js
- Supabase for authentication
- CORS and security middleware
- Rate limiting

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Docker and Docker Compose
- Supabase account and project

### Quick Start with Docker

1. Create a `.env` file in the `backend` directory with your Supabase credentials:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Update with your Supabase URL and key.

2. Create a `.env.local` file in the `frontend` directory (if not exists):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Run the application with Docker Compose:

   **Build and start containers:**
   ```bash
   docker compose up --build
   ```
   Use this when you've made changes to Dockerfiles, dependencies, or are starting fresh.
   - Rebuilds images from scratch
   - Starts containers in attached mode (shows logs in terminal)
   - Press `Ctrl+C` to stop

   **Start in detached mode:**
   ```bash
   docker compose up -d
   ```
   Use this for normal startup after initial build.
   - Starts containers in the background
   - Doesn't show logs in terminal
   - Services continue running after closing terminal

   **Stop containers:**
   ```bash
   docker compose down
   ```

   **View logs:**
   ```bash
   docker compose logs -f
   ```
   For container specific logs
   ```bash
   docker compose logs -f backend
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file (already exists):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:3000

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /profile` - Get user profile (requires auth)
- `POST /reset-password` - Send password reset email
- `GET /verify` - Verify authentication token

## Usage

1. Start both backend (port 5000) and frontend (port 3000)
2. Visit http://localhost:3000
3. Register a new account or login with existing credentials
4. Access the dashboard after successful authentication

## Project Structure

```
biztrack/
├── backend/
│   ├── config/
│   │   └── supabase.js
│   ├── routes/
│   │   └── auth.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── app/
    │   ├── auth/
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── forgot-password/
    │   ├── dashboard/
    │   ├── layout.tsx
    │   └── page.tsx
    ├── lib/
    │   └── auth-context.tsx
    ├── .env.example
    ├── .env.local
    └── package.json
```

## Environment Variables

### Backend (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `PORT` - Server port (default: 5000)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:5000/api)


## License

This project is licensed under the MIT License.
