Project Title:-
-SignalFire

Project Description:-
-Signalfire is an AI-powered Career Intelligence Platform that helps students and professionals discover personalized jobs, internships, hackathons, scholarships, and learning opportunities.
-The platform analyzes a user's profile, resume, skills, and interests using AI to recommend the best opportunities from multiple sources.

Project Web Host:-

https://0a6abaab.ps-4-agentic-ai-for-job-intern-hackthon-findings.pages.dev/
Due To API Key configuration we Turned Of Our Backend Datum Sources And The Web Works And Navigate Perfectly.

Features:-

- AI Resume Analysis
- Personalized Recommendations
- Job Search
- Internship Search
- Hackathon Discovery
- Scholarship Finder
- Learning Roadmaps
- User Authentication
- Resume Upload
- Dashboard Analytics
- Saved Opportunities
- AI Career Assistant

 Tech Stack:-

Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

Backend
- FastAPI
- Python

Database
- PostgreSQL

Authentication
- JWT

AI
- Gemini API
- Tavily Search API
- JSearch API

Deployment
- Cloudflare Pages
- Render

Note:- 
-We had developed Two UI and with Some feautre modification too.

1) Black and Minimal Features.
   Our Project Uploaded Youtube Video :- https://youtu.be/GT5SGs2YSH0

3) White and Blue Advanced Features.
   Our Project Uploaded Youtube Video :-https://youtu.be/RGpWpPnypoo?si=YOs3xxWTBVODzchX

   Key Aspect:-
   .env file cant be exposed but I just attached my .env file here, because to run in your pc sometimes the other apikeys are the default of yours can make mistakes too ,so try with us the problem basically comes on system configurations.

Frontend and Backend Setup:-

Step 1: Clone the Repository
git clone <repository-url>

cd SignalFire
Choose the theme you want to run:

black_theme

or

white_theme
Step 2: Open the Project

Open the selected theme folder in Visual Studio Code.

Example:

SignalFire/
│
├── black_theme/
│   ├── frontend/
│   └── backend/
│
└── white_theme/
    ├── frontend/
    └── backend/
Step 3: Open Two Terminals

Open two terminals in VS Code.

Terminal 1 → Backend
Terminal 2 → Frontend
⚙️ Run the Backend

In Terminal 1:

cd backend

Activate the virtual environment.

Windows:
venv\Scripts\activate
or
.\venv\Scripts\activate

Install dependencies (first time only):

pip install -r requirements.txt

Start the FastAPI server:

uvicorn app.main:app --reload

The backend will run at:

http://127.0.0.1:8000

You can verify it by opening:

http://127.0.0.1:8000/docs

Swagger UI should open successfully.

💻 Run the Frontend

In Terminal 2:

cd frontend

Install dependencies (first time only):

npm install

Start the frontend:

npm start

The frontend will run at:

http://127.0.0.1:5173
Open the Integrated Website

Ensure both servers are running simultaneously:

✅ Backend → http://127.0.0.1:8000
✅ Frontend → http://127.0.0.1:5173

Now open your browser and visit:

http://127.0.0.1:5173

The integrated SignalFire application (Frontend + Backend) will load automatically.
Future Improvements

- Mobile App
- AI Interview Preparation
- ATS Resume Score
- AI Career Coach
- Company Matching
- Salary Prediction
- Skill Gap Analysis

Team - Phoenix protocol
- Sakthivishal.T 714024243173
- Mohamed irfan.M 714024243122
- Premraj.R 714024243153

ThankYou!
