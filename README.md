# Canvas Drawing App

A full-stack canvas drawing application built with React.js frontend and Nest.js backend, using SQLite for database.

## Features

- **User Authentication**: Login and Signup functionality
- **Canvas Drawing**: Interactive canvas with drag-and-drop support
- **Photo Upload**: Upload and display images on canvas
- **Shape Drawing**: Draw rectangles and circles on canvas
- **Shape Manipulation**: Drag, resize, and delete shapes
- **Persistence**: Canvas state is saved and restored on login

## Tech Stack

### Frontend
- React.js
- React Router
- Pixi.js for canvas rendering
- Axios for API calls

### Backend
- Nest.js
- TypeORM
- SQLite database
- bcrypt for password hashing

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend application:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. First time users should sign up with name, email, and password
2. Existing users can login with email and password
3. Once logged in, you'll land on the canvas page
4. Click "Upload Photo" to add images to the canvas
5. Select "Rectangle" or "Circle" from Draw menu to draw shapes
6. Drag shapes to reposition them
7. Click on a shape to select it (red border indicates selection)
8. Delete button appears when a shape is selected
9. Canvas state is automatically saved and restored on login

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login user

### Canvas
- `GET /canvas/load/:userId` - Load canvas state for user
- `POST /canvas/save/:userId` - Save canvas state for user

## Database

The application uses SQLite database (`canvas_app.db`) which is automatically created on first run.

Tables:
- `user` - Stores user accounts (id, name, email, password)
- `canvas_state` - Stores canvas state for each user (id, userId, canvasData)

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── canvas/        # Canvas state management
│   │   ├── entities/      # Database entities
│   │   └── main.ts        # Application entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   └── CanvasPage.js
│   │   └── App.js
│   └── package.json
└── README.md
```

## Troubleshooting

- If the backend doesn't start, ensure you have Node.js installed
- If CORS errors occur, check that the backend is running on port 3001
- Clear browser cache if login persists when logging out
- Database will be recreated if deleted (sync is enabled in development)

