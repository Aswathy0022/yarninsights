# Business Requirements Document (BRD)
## YarnInsight — Yarn Quality Prediction & Operations Platform

**Version:** 2.0
**Date:** 2026-06-23
**Status:** Draft (revised — feature trim + role segregation)

---

## 1. Purpose

YarnInsight is a production-oriented workspace that predicts yarn tensile strength and quality grade from physio-chemical inputs, manages batch inventory, and produces audit-ready certificates and reports. This document captures the target business requirements after removing low-value/unused features and introducing strict role segregation between Quality Engineer and Production Manager.

## 2. Background

Yarn manufacturers need to assess incoming/in-process material quality (cellulose %, pH, fineness, tenacity, elongation, moisture, porosity, density, water swelling, dye type, etc.) and decide whether a batch should be released, reviewed, or held. Manual assessment is slow and inconsistent across operators. YarnInsight automates grade/strength prediction with machine learning and wraps it in workflow tools (batch tracking, certification, reporting) so quality decisions are faster, traceable, and standardized.

## 3. Objectives

- Predict yarn tensile strength (MPa) and quality grade (A+/A/B/C/Reject) from material properties using ML.
- Provide single-sample and bulk (CSV) prediction workflows.
- Recommend suitable end-use fabrics per batch based on its measured properties.
- Maintain a searchable batch inventory with status (Release/Review/Hold) and audit trail.
- Generate formal PDF quality certificates and Excel inventory exports.
- Enforce strict, segregated role-based access so Quality Engineer and Production Manager each see only the functions relevant to their job.
- Log all material system actions (logins, batch changes, predictions, certificate generation) for traceability.

## 4. Scope

### 4.1 Removed Features (out of scope as of this revision)
The following existing pages/features are to be **removed** from the application:
- Advanced Analytics (correlation heatmaps, statistical distributions)
- Supplier Analysis (supplier scorecards, defect-rate gauges)
- AI Chat Assistant (rule-based chatbot, persisted chat history)
- Documentation page (model metadata / R² / accuracy display)

Associated backing data (`chat_messages` table) and any analytics/supplier-only computation code should be removed or disabled along with the pages. Audit logging and prediction history are retained regardless of this trim — they are independent of the removed pages.

### 4.2 In Scope (retained / target feature set)
- Streamlit web application, single-process, SQLite-backed.
- ML-driven strength regression and grade classification trained from a CSV dataset at startup.
- Single-sample prediction with sandbox/sensitivity view.
- Fabric suitability recommendation.
- Batch inventory management (search, edit, delete, status).
- Bulk CSV prediction workflow.
- PDF certificate generation and Excel export.
- Role-based login with **segregated** access per role (Admin, Production Manager, Quality Engineer), self-signup for the two non-admin roles.
- Audit logging and prediction history.

### 4.3 Out of Scope (general platform constraints, unchanged)
- External system integrations (no email service, no payment, no third-party LLM/API calls).
- Multi-concurrent-writer database (SQLite; migration to PostgreSQL needed for concurrent operators).
- Mobile-native client (web only, via Streamlit).

## 5. Stakeholders / User Roles & Page Access (Segregated)

| Page | Admin | Quality Engineer | Production Manager |
|---|---|---|---|
| Home / Portal | ✅ | ✅ | ✅ |
| Executive Dashboard | ✅ | — | ✅ |
| Predict Strength & Grade | ✅ | ✅ | — |
| Fabric Recommendation | ✅ | ✅ | — |
| Batch Management | ✅ | ✅ | — |
| Bulk Prediction Tool | ✅ | — | ✅ |
| Report & Certificates | ✅ | ✅ | — |
| Admin Control Panel | ✅ | — | — |

**Role rationale:**
- **Quality Engineer** owns individual quality decisions: runs predictions, reviews/edits batches based on quality outcome, generates certificates. No bulk/ops-level tooling.
- **Production Manager** owns operational throughput and visibility: runs bulk predictions across incoming batches, watches the Executive Dashboard for production-level trends. No individual quality-call tools, no certification authority.
- **Admin** retains full access plus the Admin Control Panel (user management, audit logs, data cleanup).

Self-signup is available for Production Manager and Quality Engineer roles, but the role selected at signup determines page access per the table above — there is no shared "operational" tier anymore. Admin accounts are seeded via environment configuration, not self-signup.

## 6. Functional Requirements

### 6.1 Authentication & Authorization
- FR-1: System shall authenticate users via email + password (PBKDF2-SHA256, configurable iteration count, default 260,000).
- FR-2: System shall auto-upgrade legacy SHA256 password hashes to PBKDF2 on next successful login.
- FR-3: System shall enforce a minimum password length of 12 characters at signup.
- FR-4: System shall support an optional demo-user seed mode (`YARNINSIGHT_ALLOW_DEMO_USERS`) for non-production environments only; must remain disabled in production.
- FR-5: System shall restrict the Admin Control Panel to the Admin role only.
- FR-6: System shall restrict each page to the roles listed in Section 5's access table; a user navigating directly to an unauthorized page shall be blocked/redirected, not just hidden from navigation.

### 6.2 Prediction Engine (Quality Engineer + Admin)
- FR-7: System shall train a RandomForestRegressor (strength, MPa) and a RandomForestClassifier (grade) at application startup from the configured training CSV (`YARNINSIGHT_CSV_PATH`), using 13 numeric material features and 1 categorical feature (Dye Type).
- FR-8: System shall expose single-sample prediction with an interactive sandbox/sensitivity view, restricted to Quality Engineer and Admin.
- FR-9: System shall classify grade using a weighted quality score across five material attributes, banded as: ≥80 A+ (Premium), 65–80 A, 50–65 B, 35–50 C, <35 Reject.
- FR-10: System shall flag risk level (High/Medium/Low) based on grade and the count of out-of-bound material attributes (strength, pH, moisture, porosity, tenacity thresholds).

### 6.3 Bulk Prediction (Production Manager + Admin)
- FR-11: System shall support bulk prediction via CSV upload, applying the trained model to every row and returning grade, strength, risk level, and fabric-match outputs per row, downloadable as CSV. Restricted to Production Manager and Admin.

### 6.4 Fabric Suitability (Quality Engineer + Admin)
- FR-12: System shall score each batch's suitability against 8 fabric end-uses (Denim, T-Shirts, Knitwear, Sportswear, Home Textiles, Upholstery, Industrial, Bags) using rule-based physio-chemical matching, modulated by predicted grade.

### 6.5 Batch & Inventory Management (Quality Engineer + Admin)
- FR-13: System shall store batches with supplier, predicted strength/grade/confidence, risk level and reasons, status, and full material property set.
- FR-14: System shall allow searching/filtering batches by ID, supplier, grade, and status.
- FR-15: System shall allow inline edit of batch supplier name and deletion of batches, restricted to Quality Engineer and Admin.
- FR-16: System shall derive batch status automatically: Release (A+/A), Review (B or a hold flag), Hold (Reject or 3+ risk flags).

### 6.6 Executive Dashboard (Production Manager + Admin)
- FR-17: System shall display production-level KPIs, batch trends, and grade distribution to Production Manager and Admin for operational oversight.

### 6.7 Reporting & Certification (Quality Engineer + Admin)
- FR-18: System shall generate a branded PDF quality certificate per batch (ReportLab) including batch parameters, quality stamp, risk profile, and fabric recommendations. Restricted to Quality Engineer and Admin.
- FR-19: System shall export batch inventory to a styled Excel workbook (openpyxl). Restricted to Quality Engineer and Admin.

### 6.8 Audit & History (system-wide, all roles' actions logged)
- FR-20: System shall log all material actions (LOGIN, LOGOUT, BATCH_CREATE, BULK_PREDICT, CERT_GEN, etc.) with timestamp, user email, and detail to an audit table.
- FR-21: System shall retain a full history of individual predictions (inputs, outputs, user, timestamp) independent of batch records.

### 6.9 Admin
- FR-22: System shall let Admins manage user accounts (role assignment, deletion) and view/clean audit and batch data.

## 7. Non-Functional Requirements

- NFR-1 (Security): Passwords stored only as salted PBKDF2 hashes; demo users disabled by default; admin credentials sourced from environment variables, not hardcoded.
- NFR-2 (Persistence): Database, dataset, generated reports, and secrets must be excluded from version control and placed in persistent storage in production.
- NFR-3 (Deployment): Application must run behind HTTPS via reverse proxy or managed platform in production.
- NFR-4 (Reliability/Backup): SQLite database must be backed up regularly; migration to PostgreSQL required once multiple concurrent operators are expected.
- NFR-5 (Configurability): Key paths and security parameters (DB path, CSV path, password iteration count, journal mode) must be environment-configurable, not hardcoded.
- NFR-6 (Traceability): Every prediction and material system action must be auditable after the fact (user, timestamp, action).
- NFR-7 (Access Control Integrity): Page-level role restrictions must be enforced server-side (session-state checks on every render), not merely by hiding navigation links.

## 8. Data Requirements

- Training data source: CSV (`yarn data.csv`) with material property columns; sampled (8,000 records) and split 80/20 for train/test at each startup.
- Core entities (SQLite): `users`, `batches`, `prediction_history`, `audit_logs`. The `chat_messages` table is deprecated and removed along with the AI Chat Assistant feature.
- Batches table seeds 60 records on fresh init via `init_db.py`.

## 9. Constraints & Assumptions

- Single-node SQLite deployment; not designed for concurrent multi-writer production load without migration to PostgreSQL.
- Model is retrained from CSV on every application startup rather than loaded from a persisted model artifact — startup time and reproducibility depend on dataset stability.
- Demo users, if enabled, are a known security exposure and must remain disabled in production.
- Removing Advanced Analytics, Supplier Analysis, AI Chat Assistant, and Documentation pages assumes no current user depends on them; confirm with stakeholders before deletion (see Open Questions).

## 10. Acceptance Criteria (Sample)

- Given a Production Manager account, Predict Strength & Grade, Fabric Recommendation, Batch Management, and Report & Certificates are not reachable (nav hidden and direct navigation blocked).
- Given a Quality Engineer account, Bulk Prediction Tool and Executive Dashboard are not reachable.
- Given an Admin account, all pages listed in Section 5 are reachable.
- Given a batch with Reject grade or ≥3 risk flags, system sets status to Hold.
- Given a certificate generation request for a batch by a Quality Engineer or Admin, a PDF is produced containing the batch's quality stamp, risk profile, and fabric recommendations; the same request by a Production Manager is rejected.
- Given a login with a legacy SHA256 password hash, login succeeds and the hash is upgraded to PBKDF2 on that same request.
- Advanced Analytics, Supplier Analysis, AI Chat Assistant, and Documentation pages are absent from navigation for all roles, including Admin.

## 11. Open Questions for Stakeholders

- Should Admin retain access to the removed features (Analytics/Supplier/Chat/Documentation), or are they fully removed system-wide as drafted here?
- Is migration to PostgreSQL required for the current/target deployment, given expected concurrent operator count?
- What is the intended training-data refresh process — should the model load a persisted artifact instead of retraining from CSV on every restart?
- What retention/purge policy is required for audit logs and prediction history?
- Should Production Manager retain any visibility into individual batch quality detail (read-only), or is Bulk Prediction + Dashboard the complete intended scope?
