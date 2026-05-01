# Real-Time Chat Application

A professional and modern real-time chat application built as Task 4 for the Prodigy InfoTech Full Stack Development Internship. This application features secure authentication, real-time messaging, profile management, and seamless media sharing.

## ✨ Features

- **Real-Time Messaging**: Instant message delivery and syncing using Firebase Realtime/Firestore databases.
- **Authentication**: Secure user login, registration, and session management powered by Firebase Auth.
- **User Profiles**: View and edit user profiles, upload avatars, and check other users' online/offline statuses in real time.
- **Media Sharing**: Upload and send images seamlessly via ImageKit integration.
- **Typing Indicators**: Visual feedback when other users are typing.
- **Responsive & Modern UI**: Beautiful, accessible, and responsive interface built with Tailwind CSS v4 and Radix UI primitives.

## 🛠️ Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) & [TanStack Start/Router](https://tanstack.com/router/latest)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Backend Services**: [Firebase](https://firebase.google.com/) (Auth & Firestore)
- **Media Hosting**: [ImageKit.io](https://imagekit.io/)
- **State/Query Management**: [TanStack Query](https://tanstack.com/query/latest)
- **Build Tool**: [Vite](https://vitejs.dev/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)
- An ImageKit account for media uploads (if replacing default configuration)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AmarAhmedDev/PRODIGY_FS_04.git
   cd PRODIGY_FS_04/Task_4
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 📁 Project Structure

```text
src/
├── components/     # Reusable UI components (chat interface, UI primitives)
├── contexts/       # React contexts (e.g., AuthContext)
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and shared library configurations
├── routes/         # TanStack router page configurations
├── server/         # Server-side logic / server functions (if any)
└── services/       # External API integrations (Firebase, ImageKit)
```

## 📜 License

This project is licensed under the MIT License.

---
*Developed by [Amar Ahmed](https://github.com/AmarAhmedDev) as part of the Prodigy InfoTech Internship.*
