# Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Installation Steps

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:3001`

### 2. Frontend Setup

Open a new terminal and run:

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

## Usage

1. When you first visit the app, you'll be redirected to the login page
2. Click "Sign up" to create a new account
3. Enter your name, email, and password
4. You'll be automatically logged in and directed to the canvas page
5. Use the sidebar menu to:
   - Upload photos
   - Draw rectangles or circles
6. Click on shapes/images to select them
7. Drag items to move them
8. For images: Click and use the corner handles to resize
9. Click "Delete Selected" to remove selected items
10. Your canvas state is automatically saved and will be restored when you log in again

## Features Implemented

✅ User authentication (signup/login)
✅ Photo upload with file picker
✅ Drag and drop images on canvas
✅ Resize images using transform handles
✅ Draw rectangles and circles
✅ Drag shapes to reposition
✅ Select shapes (red border when selected)
✅ Delete selected shapes or images
✅ Canvas state persistence - saves automatically
✅ Canvas state restored on login

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── canvas/            # Canvas state management
│   │   │   ├── canvas.controller.ts
│   │   │   ├── canvas.service.ts
│   │   │   └── canvas.module.ts
│   │   ├── entities/          # Database models
│   │   │   ├── user.entity.ts
│   │   │   └── canvas-state.entity.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Login.css
│   │   │   ├── Signup.js
│   │   │   ├── CanvasPage.js
│   │   │   └── CanvasPage.css
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   └── package.json
├── README.md
└── SETUP.md
```

## Troubleshooting

### Backend won't start
- Ensure port 3001 is not in use
- Check that all dependencies are installed
- Delete `node_modules` and reinstall if needed

### Frontend won't start
- Ensure port 3000 is not in use
- Check that all dependencies are installed

### CORS errors
- Make sure backend is running on port 3001
- Check browser console for errors

### Canvas not loading
- Check network tab for API calls
- Verify backend is running
- Check console for errors

### Images not appearing
- Ensure image format is supported (jpg, png, gif)
- Check browser console for errors

