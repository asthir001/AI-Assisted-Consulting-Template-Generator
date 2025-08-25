# Consultant Template Generator

This project is a full-stack web application for generating, refining, and exporting professional consulting templates for any company or domain. It leverages AI (Google Gemini) for real-time data and template generation, and provides a modern, interactive frontend.

## Project Structure

- `backend/`: FastAPI server for template generation, refinement, and export (PDF, DOCX, TXT).
- `frontend/`: React + TypeScript web app for user interaction and visualization.

## Features

- **Generate Consulting Templates**: AI-powered, real-time, with references.
- **Refine Templates**: Add sections, expand details, visualize data (graphs), and more.
- **Export**: Download templates as PDF, DOCX, or TXT.
- **Modern UI**: Responsive, beautiful design using Material UI.

## Getting Started

### Backend (FastAPI)

1. Install dependencies:
	```bash
	pip install -r backend/requirements.txt
	```
2. Set your Gemini API key (optional, default provided in code):
	- Set environment variable `GEMINI_API_KEY`.
3. Start the server:
	```bash
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
	```

### Frontend (React)

1. Install dependencies:
	```bash
	cd frontend
	npm install
	```
2. Start the development server:
	```bash
	npm start
	```
	The app runs at [http://localhost:3000](http://localhost:3000)

## Usage

1. Open the frontend in your browser.
2. Enter company name and task/domain, then generate a template.
3. Refine the template or visualize data as needed.
4. Export the template in your preferred format.

## API Endpoints (Backend)

- `POST /generate-template`: Generate a new consulting template.
- `POST /refine-template`: Refine or add to an existing template.
- `POST /export-template`: Export template as PDF, DOCX, or TXT.

## Technologies Used

- **Backend**: FastAPI, Google Gemini, Pandoc, ReportLab, python-docx, markdown2
- **Frontend**: React, TypeScript, Material UI, Axios, React Markdown, Syntax Highlighter

## Folder Structure

- `backend/`
  - `main.py`: FastAPI app and endpoints
  - `client.py`: Gemini API client
  - `requirements.txt`: Python dependencies
- `frontend/`
  - `src/pages/HomePage.tsx`: Landing page
  - `src/pages/TemplatePage.tsx`: Template generation & refinement
  - `package.json`: JS dependencies

## License

MIT