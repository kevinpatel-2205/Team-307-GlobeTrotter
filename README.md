🌍 GlobeTrotter — Odoo x Hackathon 2025
A smart travel planning and booking platform that enables users to explore destinations, create itineraries, and manage bookings — all in one place. With secure authentication, a modern UI, and a robust backend, GlobeTrotter connects travelers with curated travel experiences while giving admins control to moderate and manage listings.

## link for Documentation and video e project
https://drive.google.com/drive/folders/1EA50NwvJ4vt8omBZ3ie6P2Qnxii9-cBE?usp=drive_link


## 🆔 Team ID: 307

| Name                         | Role                                        | GitHub Link                                                          |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| *Bhavi SheetalKumar Patel* | Team Leader / Database Admin                | [GitHub](https://github.com/bhavipate/Team-307-GlobeTrotter)         |
| *Amit Prajapati*           | Backend & API Developer                     | [GitHub](https://github.com/amitprajapati0702/Team-307-GlobeTrotter) |
| *Kevin Patel*              | Frontend Developer (React) & UI/UX Designer | [GitHub](https://github.com/kevinpatel-2205/Team-307-GlobeTrotter)   |


## 🏛 System Architecture


             ┌───────────────────────────────────┐
             │   GlobeTrotter Frontend (React)   │
             │  Responsive UI / React Router /   │
             │   Tailwind CSS / Material UI      │
             └───────────────────────────────────┘
                           │
                           ▼
             ┌───────────────────────────────────┐
             │      Backend API Server            │
             │      Node.js + Express.js          │
             └───────────────────────────────────┘
                   │                     │
                   ▼                     ▼
    ┌──────────────────────────┐   ┌──────────────────────────┐
    │ Postgresql Database      │   │    Image / Media Storage │
    │  Users, Trips, Bookings  │   │  Destination & Profile   │
    │  Itineraries, Metadata   │   │ Images stored, URL links │
    └──────────────────────────┘   └──────────────────────────┘




## 📡 API Status Codes

1. *200 (Success)* – DB/API operations successful, login success, data retrieved.
2. *201 (Created)* – New user registered, new booking created.
3. *204 (No Content)* – No destinations/bookings found.
4. *401 (Unauthorized)* – Invalid credentials.
5. *403 (Forbidden)* – Access denied for non-admin users.
6. *404 (Not Found)* – Resource does not exist.
7. *500 (Internal Server Error)* – Database or server error.


## 👥 User Roles

### *Admin*

* Approve/reject travel listings.
* Remove spam/inappropriate content.
* Manage user accounts.
* Access admin dashboard analytics.

### *Registered Users*

* Sign up and log in securely.
* Browse destinations and itineraries.
* Book trips and manage their bookings.
* Edit profile and upload a profile picture.


## ✅ Testing & Validation Summary

* *Authentication*: Signup, login, JWT-based protected routes.
* *Booking Flow*: Destination search, booking confirmation, payment workflow (mock/test).
* *Admin Dashboard*: Approval/rejection of listings.
* *Security*: bcrypt password hashing, SQL injection prevention, HTTPS.
* *Performance*: Optimized MySQL queries, API response time <1s.
* *UI/UX*: Responsive layouts tested on desktop, tablet, and mobile.

  ## How the System Works (High-Level Flow)

1. *User visits GlobeTrotter*  
   The React frontend loads instantly in the browser for a smooth user experience.

2. *Signup/Login*  
   User credentials are sent to the backend API, verified in the Postgresql database, and a JWT token is returned for authentication.

3. *Browse Destinations*  
   The frontend fetches travel destination data from the backend API. Destination images are loaded from the media storage.

4. *Book a Trip*  
   User selects a destination and travel dates. The backend API creates a booking entry in the Postgresql database.

5. *Admin Management*  
   Admin users review and approve or reject new travel listings through the admin dashboard.

6. *Secure Access*  
   All user and admin routes are protected using JWT tokens to ensure secure API access.
