# Canvas Drawing Application - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Quick Setup Guide](#quick-setup-guide)
3. [Features](#features)
4. [Business Requirements Document (BRD)](#business-requirements-document-brd)
5. [Functional Specification Document (FSD)](#functional-specification-document-fsd)
6. [Technical Architecture](#technical-architecture)
7. [API Documentation](#api-documentation)

---

## Project Overview

A full-stack interactive canvas drawing application that enables users to create, manipulate, and persist graphical elements (shapes and images) on a dynamic canvas. The application provides real-time drawing capabilities with user authentication and persistent storage.

**Tech Stack:**
- **Frontend:** React.js, Pixi.js, Axios
- **Backend:** Nest.js, TypeORM, SQLite
- **Authentication:** bcrypt for password hashing

---

## Quick Setup Guide

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:3001`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000`

### Database
SQLite database (`canvas_app.db`) is automatically created on first backend run.

---

## Features

### 1. User Authentication
- **User Registration (Signup)**
  - Create new account with name, email, and password
  - Email validation and password hashing
  - Automatic login after successful registration

- **User Login**
  - Secure authentication with email and password
  - Session management
  - Redirect to canvas after successful login

- **User Logout**
  - Secure session termination
  - Clear user data and redirect to login page

### 2. Canvas Drawing & Manipulation
- **Shape Creation**
  - Draw rectangles by drag-and-drop
  - Draw circles by drag-and-drop
  - Real-time preview while drawing
  - Shapes appear exactly where drawn (no position snapping)

- **Shape Selection**
  - Click to select shapes or images
  - Visual feedback with red border on selection
  - Selected item highlights with resize handles

- **Shape Manipulation**
  - **Drag & Drop:** Move shapes/images to any position on canvas
  - **Resize:** Corner handles for resizing shapes and images
  - **Delete:** Delete button appears only for selected item

- **Image Management**
  - Upload images via file picker
  - Images appear on canvas with drag-and-drop support
  - Resize images using corner handles
  - Same manipulation features as shapes

### 3. Canvas Persistence
- **Auto-Save:** Canvas state automatically saves after any change (1 second debounce)
- **Auto-Load:** Canvas state restored on login/reload
- **State Preservation:** All element positions maintained across sessions

### 4. User Interface
- **Sidebar Navigation**
  - Elements dropdown menu (Rectangle, Circle with icons)
  - Upload button for images
  - Logout button at bottom
  - Clean, modern design

- **Canvas Area**
  - Interactive drawing surface
  - Grid background for better alignment
  - Full-screen responsive layout

### 5. Interactive Features
- **Real-time Preview:** See shape dimensions while drawing
- **Visual Feedback:** Selection indicators, resize handles, delete buttons
- **Smooth Interactions:** Optimized drag, resize, and move operations

---

## Business Requirements Document (BRD)

### 1. Business Objective
Create an interactive canvas application that allows users to create, edit, and persist graphical designs on a web-based platform with user authentication.

### 2. Business Goals
- Enable users to draw shapes and upload images on a canvas
- Provide persistent storage for user creations
- Ensure secure user authentication
- Deliver intuitive user experience

### 3. Target Users
- Design enthusiasts
- Content creators
- Users needing quick visual mockups
- Anyone requiring a simple drawing tool

### 4. Business Requirements

#### 4.1 User Management
- **REQ-1.1:** Users must be able to register with email and password
- **REQ-1.2:** Users must be able to login securely
- **REQ-1.3:** Each user must have isolated canvas data
- **REQ-1.4:** Users must be able to logout securely

#### 4.2 Canvas Functionality
- **REQ-2.1:** Users must be able to draw rectangles and circles
- **REQ-2.2:** Users must be able to upload and display images
- **REQ-2.3:** Users must be able to move, resize, and delete elements
- **REQ-2.4:** Canvas state must persist across sessions

#### 4.3 Data Persistence
- **REQ-3.1:** All canvas changes must be saved automatically
- **REQ-3.2:** Canvas state must restore on user login
- **REQ-3.3:** Each user's data must be isolated and secure

#### 4.4 User Experience
- **REQ-4.1:** Interface must be intuitive and easy to navigate
- **REQ-4.2:** Interactions must be responsive and smooth
- **REQ-4.3:** Visual feedback must be clear and immediate

### 5. Success Criteria
- Users can successfully register and login
- Users can draw shapes and upload images
- Canvas state persists correctly
- Application is responsive and stable
- User data is secure

---

## Functional Specification Document (FSD)

### 1. System Overview
The application consists of a React frontend communicating with a Nest.js backend API. The backend manages authentication and canvas state persistence using SQLite database.

### 2. Functional Modules

#### 2.1 Authentication Module

**2.1.1 User Registration**
- **Input:** Name, email, password
- **Validation:**
  - Email format validation
  - Password strength requirements
  - Duplicate email check
- **Output:** Success message or error
- **Behavior:** Creates user account, hashes password, stores in database

**2.1.2 User Login**
- **Input:** Email, password
- **Validation:** Credentials match stored user
- **Output:** User object with ID, authentication token (if implemented)
- **Behavior:** Validates credentials, creates session, loads user canvas state

**2.1.3 User Logout**
- **Input:** User session
- **Output:** Session termination confirmation
- **Behavior:** Clears session data, redirects to login

#### 2.2 Canvas Module

**2.2.1 Shape Drawing**
- **Rectangle Tool:**
  - Click and drag on canvas to define rectangle
  - Preview rectangle during drag
  - Release to create rectangle at exact position
  - Rectangle stored with: x, y, width, height, fill, stroke, strokeWidth

- **Circle Tool:**
  - Click and drag to define radius
  - Preview circle during drag
  - Release to create circle at center position
  - Circle stored with: x, y, width (diameter), height (diameter), fill, stroke, strokeWidth

**2.2.2 Image Upload**
- **Input:** Image file (JPG, PNG, GIF)
- **Processing:** Convert to base64 data URL
- **Output:** Image displayed on canvas
- **Storage:** Image data stored with: id, url (base64), x, y, width, height

**2.2.3 Element Selection**
- **Trigger:** Click on shape or image
- **Visual Feedback:** Red border on selected element
- **Actions Enabled:** Resize, delete, drag
- **State:** Only one element selected at a time

**2.2.4 Element Manipulation**

- **Drag Operation:**
  - Click and hold on element
  - Move mouse to new position
  - Release to drop
  - Update element x, y in state

- **Resize Operation:**
  - Select element (shows corner handles)
  - Drag corner handle
  - Update width and height in real-time
  - Save final dimensions on release

- **Delete Operation:**
  - Select element
  - Click delete button (appears only for selected)
  - Remove element from canvas and state

**2.2.5 Canvas State Management**
- **Auto-Save:**
  - Triggered after any shape/image state change
  - Debounced to 1 second
  - Sends current state to backend API

- **Auto-Load:**
  - Triggered on component mount (after login)
  - Fetches saved canvas state from backend
  - Renders all shapes and images at saved positions

### 3. Data Models

#### 3.1 User Entity
```typescript
{
  id: number (auto-generated)
  name: string
  email: string (unique)
  password: string (hashed)
}
```

#### 3.2 Canvas State Entity
```typescript
{
  id: number (auto-generated)
  userId: number (foreign key)
  canvasData: string (JSON stringified)
}
```

#### 3.3 Shape Object (in canvasData)
```typescript
{
  id: number (timestamp)
  type: 'rectangle' | 'circle'
  x: number
  y: number
  width: number
  height: number
  fill: number (hex color)
  stroke: number (hex color)
  strokeWidth: number
}
```

#### 3.4 Image Object (in canvasData)
```typescript
{
  id: number (timestamp)
  url: string (base64 data URL)
  x: number
  y: number
  width: number
  height: number
}
```

### 4. User Interface Specifications

#### 4.1 Layout Structure
- **Left Sidebar (220px width):**
  - Header: "File" menu
  - Elements section with dropdown
  - Upload section
  - Logout button (bottom)

- **Main Canvas Area (remaining width):**
  - Full-height drawing surface
  - Grid background pattern
  - Interactive Pixi.js canvas

#### 4.2 Component Hierarchy
```
CanvasPage
├── Left Toolbar (Sidebar)
│   ├── Toolbar Header
│   ├── Toolbar Section
│   │   ├── Elements Dropdown
│   │   │   ├── Rectangle Option (with icon)
│   │   │   └── Circle Option (with icon)
│   │   └── Upload Button
│   └── Logout Button
└── Canvas Area
    └── Pixi.js Canvas Container
```

### 5. API Specifications

#### 5.1 Authentication Endpoints

**POST /auth/signup**
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object or error message

**POST /auth/login**
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object with ID or error message

#### 5.2 Canvas Endpoints

**GET /canvas/load/:userId**
- **Path Parameter:** userId (number)
- **Response:**
  ```json
  {
    "canvasData": "string (JSON)"
  }
  ```

**POST /canvas/save/:userId**
- **Path Parameter:** userId (number)
- **Request Body:**
  ```json
  {
    "canvasData": "string (JSON)"
  }
  ```
- **Response:** Success or error message

### 6. Non-Functional Requirements

#### 6.1 Performance
- Canvas interactions must be smooth (60fps target)
- API responses under 500ms
- Auto-save debounced to prevent excessive API calls

#### 6.2 Security
- Passwords hashed using bcrypt
- User data isolation (users can only access their own canvas)
- Input validation on all API endpoints

#### 6.3 Usability
- Intuitive interface with clear visual feedback
- Responsive design for different screen sizes
- Error messages displayed clearly

#### 6.4 Reliability
- Canvas state preserved even after browser refresh
- Graceful error handling
- Database transactions for data consistency

### 7. Use Cases

#### UC-1: User Registration
1. User navigates to signup page
2. Enters name, email, password
3. System validates input
4. System creates user account
5. User automatically logged in
6. User redirected to canvas

#### UC-2: Draw Rectangle
1. User clicks "Elements" in sidebar
2. User selects "Rectangle" from dropdown
3. User clicks and drags on canvas
4. Rectangle preview appears during drag
5. User releases mouse
6. Rectangle created at exact position
7. Canvas state auto-saved

#### UC-3: Upload and Manipulate Image
1. User clicks "Uploads" in sidebar
2. User selects image file
3. Image appears on canvas at default position (50, 50)
4. User clicks image to select
5. User drags image to desired position
6. User drags corner handle to resize
7. Canvas state auto-saved

#### UC-4: Save and Restore Canvas
1. User creates shapes and images
2. System auto-saves after 1 second of inactivity
3. User logs out
4. User logs back in
5. System loads saved canvas state
6. All elements appear at previous positions

---

## Technical Architecture

### Backend Architecture
- **Framework:** Nest.js (modular architecture)
- **ORM:** TypeORM for database operations
- **Database:** SQLite (file-based, no separate server needed)
- **Modules:**
  - Auth Module: Handles registration, login
  - Canvas Module: Handles canvas state save/load
  - Entities: User, CanvasState database models

### Frontend Architecture
- **Framework:** React.js (functional components with hooks)
- **Canvas Library:** Pixi.js v6 for graphics rendering
- **State Management:** React useState for component state
- **HTTP Client:** Axios for API communication
- **Components:**
  - Login: Authentication form
  - Signup: Registration form
  - CanvasPage: Main canvas interface with drawing logic

### Data Flow
1. User interacts with canvas (draws, uploads, manipulates)
2. React state updates (shapes/images arrays)
3. useEffect hook triggers auto-save after debounce
4. Axios sends POST request to backend
5. Backend saves JSON to database
6. On login/reload, backend fetches data
7. Frontend renders elements from saved state

---

## API Documentation

### Base URL
- Backend: `http://localhost:3001`

### Authentication Endpoints

#### Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Canvas Endpoints

#### Load Canvas State
```http
GET /canvas/load/:userId
```

**Example:**
```
GET /canvas/load/1
```

**Response:**
```json
{
  "canvasData": "{\"shapes\":[{\"id\":1234567890,\"type\":\"rectangle\",\"x\":100,\"y\":100,\"width\":200,\"height\":150,\"fill\":4893234,\"stroke\":2916512,\"strokeWidth\":2}],\"images\":[]}"
}
```

#### Save Canvas State
```http
POST /canvas/save/:userId
Content-Type: application/json

{
  "canvasData": "{\"shapes\":[...],\"images\":[...]}"
}
```

**Example:**
```
POST /canvas/save/1
```

---

## Project Structure

```
Assignment/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── canvas/
│   │   │   ├── canvas.controller.ts
│   │   │   ├── canvas.service.ts
│   │   │   └── canvas.module.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   └── canvas-state.entity.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── canvas_app.db
│   ├── package.json
│   └── tsconfig.json
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
│   │   ├── index.html
│   │   └── manifest.json
│   └── package.json
├── README.md
├── SETUP.md
└── PROJECT_DOCUMENTATION.md (this file)
```

---

## Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check if port 3001 is available
   - Verify Node.js version (v14+)
   - Reinstall dependencies: `rm -rf node_modules && npm install`

2. **Frontend won't start**
   - Check if port 3000 is available
   - Clear browser cache
   - Reinstall dependencies

3. **CORS errors**
   - Ensure backend is running on port 3001
   - Check browser console for detailed error

4. **Canvas not loading**
   - Verify backend API is accessible
   - Check network tab in browser dev tools
   - Ensure user is logged in

5. **Elements jumping to corner**
   - Clear browser cache
   - Check console for errors
   - Verify canvas state is saving correctly

6. **Delete button not appearing**
   - Ensure element is selected (click on it)
   - Only one delete button shows at a time
   - Check browser console for errors

---

## Future Enhancements (Potential)

- Multi-user collaboration
- Shape layer management (z-index)
- Undo/redo functionality
- Export canvas as image
- Additional shape types (line, polygon)
- Color picker for shape fill/stroke
- Text tool
- Shape grouping
- Copy/paste functionality

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Development Team

