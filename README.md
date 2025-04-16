# 🗂️ Task Management API

A backend-only RESTful API for task and project management using **Node.js** and **PostgreSQL**. Tested with Postman.

---

## 🚀 Features

- Admin/User login (JWT-based)
- Admin can assign tasks & share projects
- Users can comment on tasks
- Task grouping by status and category
- Accepts both raw JSON & form-data

---

## 🔧 Setup

1. **Install dependencies**  
   ```bash
   npm install

2. Set up .env file

 PORT=3000
 DATABASE_URL=postgres://user:password@localhost:5432/taskdb
 JWT_SECRET=your_jwt_secret

3. Run server
 npm start


## 🔧 PostgreSQL used for all data
Tables: users, tasks,projects, categories, comments
Run SQL from schema.sql or create manually


## 🔧 API ENDPOINTS
POST /signup – Register (form-data/raw)
POST /login – Login & receive token
GET /get-profile – Auth required
POST /tasks – Admin assigns task
POST /tasks/:id/comments – Auth user comments
GET /tasks/status-count – Tasks by status
GET /create-categoryy – Tasks bycreate category
GET /get-categories – Tasks by getcategory
GET /tasks/by-category – Tasks by category

GET /filter-tasks – Filter tasks
GET /search-tasks – Search Tasks 
GET /sort-tasks – Sort Tasks


Use Postman: Add Bearer Token after login

## 📦 Tools & Libraries
Express – Routing
pg – PostgreSQL
JWT – Auth
bcryptjs – Password hashing
multer – File uploads
dotenv – Env management

## ✅ Status
Fully working API
Tested in Postman
Backend only (no frontend)