# Hostel Maintenance System - Frontend 💻

Modern responsive React frontend for the Hostel Maintenance Management System. Features a two-portal interface:
1. **Student Portal**: Raise maintenance complaints and track live 3-stage progress (Raised ➔ Assigned ➔ Resolved).
2. **Warden & Staff Desk**: Interactive 3-column Kanban Task Board (Pending ➔ In Progress ➔ Solved) with 1-click status transitions and work remarks.

---

## 🛠️ Tech Stack
- **Framework**: React 19 (Vite)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: Pure Modern CSS3 (Fully Responsive)

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

UI is served at: `http://localhost:5173/`

Connects to Spring Boot backend at: `http://localhost:8080/api/complaints`
