# BioGas MIS Backend Setup Guide

## 🚀 Overview

Enterprise-grade Node.js backend using Express, Sequelize, and MySQL.

## 🛠️ Tech Stack
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL
- **Auth**: JWT (Access + Refresh Tokens)
- **Email**: Nodemailer
- **Scheduler**: Node-cron
- **Logging**: Integrated Audit Logs

## ⚙️ Configuration

1. **Database Config**: `config/config.json`
2. **Environment**: `.env`

### Optional env for MIS submit notifications
- **`MIS_NOTIFY_EMAILS`** – Comma-separated emails that receive "MIS Entry Submitted" notifications in addition to Manager/Admin users (e.g. `MIS_NOTIFY_EMAILS=ops@company.com,other@company.com`).

## 🏃‍♂️ How to Run

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Initialize Database
Creates database and seeds initial users/roles.
```bash
npm run init-db
```

### 3. Start Server
```bash
npm start
```

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@biogas.com` | `Admin@123` |
| **Manager** | `manager@biogas.com` | `User@123` |
| **Operator** | `operator@biogas.com` | `User@123` |

## 📚 API Structure

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/profile`

### MIS Operations
- `POST /api/mis-entries` (Create)
- `POST /api/mis-entries/:id/submit` (Submit Workflow)
- `POST /api/mis-entries/:id/approve` (Manager Only)
- `POST /api/mis-entries/:id/reject` (Manager Only)
- `POST /api/mis/import` (Excel Import)

### Admin
- `GET /api/admin/users`
- `GET /api/admin/audit-logs`
- `POST /api/admin/smtp-config`

## 🔄 Workflow

1. **Operator** creates entry (`draft`).
2. **Operator** submits entry (`submitted`). -> Email to Manager.
3. **Manager** approves (`approved`) or rejects (`rejected`). -> Email to Operator.
4. **System** logs all actions in `AuditLog`.

