
import os
from pydantic import BaseModel
from datetime import datetime, timezone
from collections import Counter
from fastapi.security import HTTPBearer
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from supabase import create_client
from gotrue.errors import AuthApiError
from typing import Literal
from uuid import UUID



from supabase_auth.errors import AuthApiError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

URL = os.getenv("SUPABASE_URL", "")
ANON_KEY = os.getenv("SUPABASE_KEY", "")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not URL or not ANON_KEY or not SERVICE_KEY:
    raise RuntimeError("Configure Supabase variables in .env")

# Server-only database client. Never expose SERVICE_KEY to React.
db = create_client(URL, SERVICE_KEY)
auth_client = create_client(URL, ANON_KEY)

app = FastAPI(title="CampusResolve AI", version="1.0.0")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROLES = {"student", "staff", "admin"}
STATUSES = {
    "submitted", "under_review", "assigned", "in_progress",
    "resolved", "closed", "rejected", "reopened", "cancelled"
}
PRIORITIES = {"low", "medium", "high", "urgent"}


# ---------- Request models ----------

class SignupBody(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ComplaintBody(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10, max_length=3000)
    category: str = Field(min_length=2, max_length=80)
    location: str = Field(min_length=2, max_length=200)


class ComplaintEdit(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=150)
    description: str | None = Field(default=None, min_length=10, max_length=3000)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    location: str | None = Field(default=None, min_length=2, max_length=200)


class AssignmentBody(BaseModel):
    complaint_id: str
    staff_id: str
    department_id: str

class StatusBody(BaseModel):
    status: str
    message: str = Field(default="", max_length=2000)


class NotificationRead(BaseModel):
    is_read: bool = True


from pydantic import BaseModel

class FollowupRequest(BaseModel):
    complaint_id: str


class FollowupApprovalCreate(BaseModel):
    complaint_id: UUID
    recommended_action: Literal["none", "remind", "escalate"]
    reason: str


class FollowupApprovalDecision(BaseModel):
    decision: Literal["approved", "rejected"]


# ---------- Helpers ----------

def fail(status: int, message: str):
    raise HTTPException(status_code=status, detail=message)


def one(table, **filters):
    query = db.table(table).select("*")
    for key, value in filters.items():
        query = query.eq(key, value)
    result = query.maybe_single().execute()
    return result.data


def notify(user_id: str, title: str, message: str):
    """Save an in-app notification."""
    db.table("notifications").insert({
        "user_id": user_id,
        "title": title,
        "message": message
    }).execute()


def audit(actor_id, action, complaint_id=None, details=None):
    db.table("audit_logs").insert({
        "actor_id": actor_id,
        "action": action,
        "complaint_id": complaint_id,
        "details": details or {}
    }).execute()


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        verified = auth_client.auth.get_user(token)
        auth_user = verified.user

        if not auth_user:
            fail(401, "Invalid token")

        profile = one("profiles", id=auth_user.id)

        if not profile:
            fail(403, "User profile not found")

        return profile

    except HTTPException:
        raise
    except Exception:
        fail(401, "Invalid or expired access token")



def allow(user, *roles):
    if user["role"] not in roles:
        fail(403, "Your role cannot perform this action")


def get_complaint(cid):
    complaint = one("complaints", id=cid)
    if not complaint:
        fail(404, "Complaint not found")
    return complaint


def can_view_complaint(user, complaint):
    if user["role"] == "admin":
        return True
    if user["role"] == "student":
        return complaint["student_id"] == user["id"]
    if user["role"] == "staff":
        assigned = one(
            "assignments",
            complaint_id=complaint["id"],
            staff_id=user["id"]
        )
        return (
            complaint.get("department_id") == user.get("department_id")
            or assigned is not None
        )
    return False


def require_view(user, complaint):
    if not can_view_complaint(user, complaint):
        fail(403, "You cannot access this complaint")


def call_agent(env_name, payload):
    """Call a configured n8n webhook. Never invent webhook results."""
    webhook = os.getenv(env_name, "").strip()
    if not webhook:
        return {
            "configured": False,
            "message": "Configure the n8n webhook in .env"
        }
    try:
        response = requests.post(webhook, json=payload, timeout=15)
        response.raise_for_status()
        try:
            result = response.json()
        except ValueError:
            result = {"response": response.text[:2000]}
        return {"configured": True, "result": result}
    except requests.RequestException:
        fail(502, "Automation service is unavailable")


# ---------- Health ----------

@app.get("/")
def home():
    return {"message": "CampusResolve AI API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- Authentication ----------

@app.post("/auth/signup")
def signup(body: SignupBody):
    try:
        # Admin API: email_confirm=True ki wajah se confirmation email nahi jati
        result = db.auth.admin.create_user({
            "email": str(body.email),
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {"full_name": body.full_name}
        })
        user = result.user

        # Profile row bana dein (agar trigger pehle bana chuka ho to update ho jayegi)
        db.table("profiles").upsert({
            "id": user.id,
            "full_name": body.full_name,
            "email": str(body.email),
            "role": "student"
        }).execute()

        return {
            "message": "Account created. You can login now.",
            "user_id": user.id
        }
    except Exception as e:
        print("SIGNUP ERROR:", repr(e))
        fail(400, "Signup failed. Email may already be registered.")


@app.post("/auth/login")
def login(body: LoginBody):
    try:
        response = auth_client.auth.sign_in_with_password({
            "email": str(body.email),
            "password": body.password
        })

        if not response.session:
            raise HTTPException(status_code=401, detail="No session returned")

        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }

    except AuthApiError as e:
        print("LOGIN ERROR:", e.message)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    except HTTPException:
        raise

    except Exception as e:
        print("LOGIN ERROR:", repr(e))
        raise HTTPException(status_code=500, detail="Login failed")
    
@app.get("/auth/me")
def me(user=Depends(current_user)):
    return {"user": user}


# ---------- Departments and profiles ----------

@app.get("/departments")
def departments(user=Depends(current_user)):
    return db.table("departments").select("*").order("name").execute().data


@app.get("/users")
def list_users(user=Depends(current_user)):
    allow(user, "admin")
    return (
        db.table("profiles")
        .select("id,full_name,email,role,department_id,created_at")
        .order("full_name")
        .execute().data
    )


@app.patch("/users/{uid}/role")
def set_user_role(uid: str, body: dict, user=Depends(current_user)):
    allow(user, "admin")
    role = body.get("role")
    if role not in ROLES:
        fail(400, "Invalid role")

    department_id = body.get("department_id")
    if role == "staff" and not department_id:
        fail(400, "Staff must have a department")
    if department_id and not one("departments", id=department_id):
        fail(400, "Department not found")

    updated = db.table("profiles").update({
        "role": role,
        "department_id": department_id if role == "staff" else None
    }).eq("id", uid).execute().data

    if not updated:
        fail(404, "User not found")

    audit(user["id"], "user_role_updated", details={
        "user_id": uid, "role": role
    })
    return updated[0]


# ---------- Complaint CRUD ----------

@app.post("/complaints")
def create_complaint(body: ComplaintBody, user=Depends(current_user)):
    allow(user, "student")

    data = {
        "student_id": user["id"],
        "title": body.title.strip(),
        "description": body.description.strip(),
        "category": body.category.strip(),
        "location": body.location.strip(),
        "status": "submitted",
        "priority": "medium"
    }

    try:
        result = db.table("complaints").insert(data).execute()
        complaint = result.data[0]
        audit(user["id"], "complaint_created", complaint["id"])

        # AI triage is a recommendation, not an automatic approval.
        try:
            agent_result = call_agent("N8N_TRIAGE_URL", {
                "complaint": complaint
            })
        except HTTPException:
            agent_result = {
                "configured": True,
                "message": "Triage failed; complaint was still saved"
            }

        return {"complaint": complaint, "triage": agent_result}
    except HTTPException:
        raise
    except Exception:
        fail(500, "Could not create complaint")


@app.get("/complaints")
def list_complaints(
    status: str | None = Query(default=None),
    user=Depends(current_user)
):
    query = db.table("complaints").select("*").order(
        "created_at", desc=True
    )

    if status:
        if status not in STATUSES:
            fail(400, "Invalid status")
        query = query.eq("status", status)

    if user["role"] == "student":
        query = query.eq("student_id", user["id"])
    elif user["role"] == "staff":
        query = query.eq("department_id", user.get("department_id"))

    return query.execute().data


@app.get("/complaints/{cid}")
def complaint_detail(cid: str, user=Depends(current_user)):
    complaint = get_complaint(cid)
    require_view(user, complaint)
    return complaint


@app.patch("/complaints/{cid}")
def edit_complaint(
    cid: str, body: ComplaintEdit, user=Depends(current_user)
):
    complaint = get_complaint(cid)

    if user["role"] != "student" or complaint["student_id"] != user["id"]:
        fail(403, "Only the complaint owner can edit this complaint")

    if complaint["status"] not in {"submitted", "under_review"}:
        fail(409, "This complaint can no longer be edited")

    changes = body.model_dump(exclude_unset=True)
    if not changes:
        fail(400, "No changes supplied")
    if any(value is None for value in changes.values()):
        fail(400, "Fields cannot be null")

    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    updated = db.table("complaints").update(changes).eq(
        "id", cid
    ).execute().data

    audit(user["id"], "complaint_edited", cid)
    return updated[0]


@app.delete("/complaints/{cid}")
def cancel_complaint(cid: str, user=Depends(current_user)):
    complaint = get_complaint(cid)
    if user["role"] != "student" or complaint["student_id"] != user["id"]:
        fail(403, "Only the complaint owner can cancel it")
    if complaint["status"] not in {"submitted", "under_review"}:
        fail(409, "Complaint cannot be cancelled at this stage")

    result = db.table("complaints").update({
        "status": "cancelled",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", cid).execute()

    audit(user["id"], "complaint_cancelled", cid)
    return {"message": "Complaint cancelled", "complaint": result.data[0]}


# ---------- Assignment ----------

@app.post("/assignments")
def assign_complaint(
    body: AssignmentBody, user=Depends(current_user)
):
    allow(user, "admin")
    complaint = get_complaint_from_assignment(body)

    staff = one("profiles", id=body.staff_id)
    if not staff or staff["role"] != "staff":
        fail(400, "Select a valid staff account")
    if staff.get("department_id") != body.department_id:
        fail(400, "Staff does not belong to this department")
    if complaint["status"] in {"closed", "cancelled", "rejected"}:
        fail(409, "Cannot assign a closed complaint")

    try:
        assignment = db.table("assignments").insert({
            "complaint_id": complaint["id"],
            "staff_id": body.staff_id,
            "assigned_by": user["id"]
        }).execute().data[0]
    except Exception:
        fail(409, "This staff member may already be assigned")

    db.table("complaints").update({
        "department_id": body.department_id,
        "status": "assigned",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", complaint["id"]).execute()

    notify(body.staff_id, "Complaint assigned", complaint["title"])
    notify(
        complaint["student_id"],
        "Complaint assigned",
        "Your complaint has been assigned to a department."
    )
    audit(user["id"], "complaint_assigned", complaint["id"])
    return assignment


def get_complaint_from_assignment(body):
    # Defined as a helper so assignment validation remains centralized.
    cid = getattr(body, "complaint_id", None)
    if not cid:
        fail(400, "Assignment needs complaint_id")
    return get_complaint(cid)


# ---------- Complaint status and progress ----------

@app.patch("/complaints/{cid}/status")
def update_status(
    cid: str, body: StatusBody, user=Depends(current_user)
):
    complaint = get_complaint(cid)
    require_view(user, complaint)

    if body.status not in STATUSES:
        fail(400, "Invalid status")

    old = complaint["status"]
    allowed = {
        "student": {
            ("resolved", "closed"),
            ("resolved", "reopened"),
        },
        "staff": {
            ("assigned", "in_progress"),
            ("in_progress", "resolved"),
            ("reopened", "in_progress"),
        },
        "admin": {
            (old, "under_review"),
            (old, "assigned"),
            (old, "in_progress"),
            (old, "resolved"),
            (old, "closed"),
            (old, "rejected"),
            (old, "reopened"),
        }
    }

    if (old, body.status) not in allowed[user["role"]]:
        fail(409, "Status transition is not allowed")

    if user["role"] == "student":
        if complaint["student_id"] != user["id"]:
            fail(403, "Not your complaint")
        if body.status == "closed" and old != "resolved":
            fail(409, "Only resolved complaints can be closed")
    elif user["role"] == "staff":
        if body.status not in {"in_progress", "resolved"}:
            fail(403, "Staff cannot perform this status change")
        if not one("assignments", complaint_id=cid, staff_id=user["id"]):
            fail(403, "You must be assigned to this complaint")

    changes = {
        "status": body.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    updated = db.table("complaints").update(changes).eq(
        "id", cid
    ).execute().data[0]

    db.table("complaint_updates").insert({
        "complaint_id": cid,
        "updated_by": user["id"],
        "message": body.message or f"Status changed to {body.status}",
        "old_status": old,
        "new_status": body.status
    }).execute()

    notify(
        complaint["student_id"],
        "Complaint status updated",
        f"Status: {body.status}"
    )
    audit(user["id"], "status_changed", cid, {
        "old_status": old, "new_status": body.status
    })
    return updated


@app.get("/complaints/{cid}/updates")
def get_updates(cid: str, user=Depends(current_user)):
    complaint = get_complaint(cid)
    require_view(user, complaint)
    return (
        db.table("complaint_updates").select("*")
        .eq("complaint_id", cid).order("created_at").execute().data
    )


@app.post("/complaints/{cid}/updates")
def add_update(
    cid: str, body: StatusBody, user=Depends(current_user)
):
    complaint = get_complaint(cid)
    require_view(user, complaint)

    if user["role"] == "student" and complaint["student_id"] != user["id"]:
        fail(403, "Not your complaint")
    if user["role"] == "staff" and not one(
        "assignments", complaint_id=cid, staff_id=user["id"]
    ):
        fail(403, "Only assigned staff can add progress updates")
    if not body.message.strip():
        fail(400, "Message is required")

    return db.table("complaint_updates").insert({
        "complaint_id": cid,
        "updated_by": user["id"],
        "message": body.message.strip()
    }).execute().data[0]


# ---------- AI agent workflow endpoints ----------

@app.post("/agents/triage/{cid}")
def run_triage(cid: str, user=Depends(current_user)):
    allow(user, "admin", "staff")
    complaint = get_complaint(cid)
    require_view(user, complaint)
    return call_agent("N8N_TRIAGE_URL", {"complaint": complaint})


@app.post("/agents/assignment/{cid}")
def run_assignment_agent(cid: str, user=Depends(current_user)):
    allow(user, "admin")
    complaint = get_complaint(cid)
    return call_agent("N8N_ASSIGNMENT_URL", {"complaint": complaint})


@app.post("/agents/followup")
def run_followup_agent(
    request: FollowupRequest,
    user=Depends(current_user)
):
    allow(user, "admin")

    return call_agent("N8N_FOLLOWUP_URL", {
        "trigger": "manual_admin_run",
        "complaint_id": request.complaint_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@app.post("/followup-approvals")
def create_followup_approval(
    request: FollowupApprovalCreate,
    user=Depends(current_user)
):
    allow(user, "admin")

    result = supabase.table("followup_approvals").insert({
        "complaint_id": str(request.complaint_id),
        "recommended_action": request.recommended_action,
        "reason": request.reason,
        "status": "pending",
        "requested_by": user["id"]
    }).execute()

    return {
        "message": "Approval request created",
        "approval": result.data[0] if result.data else None
    }


@app.patch("/followup-approvals/{approval_id}")
def review_followup_approval(
    approval_id: UUID,
    request: FollowupApprovalDecision,
    user=Depends(current_user)
):
    allow(user, "admin")

    existing = (
        supabase.table("followup_approvals")
        .select("id, status")
        .eq("id", str(approval_id))
        .limit(1)
        .execute()
    )

    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found"
        )

    if existing.data[0]["status"] != "pending":
        raise HTTPException(
            status_code=409,
            detail="This request has already been reviewed"
        )

    result = (
        supabase.table("followup_approvals")
        .update({
            "status": request.decision,
            "reviewed_by": user["id"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        })
        .eq("id", str(approval_id))
        .eq("status", "pending")
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=409,
            detail="Request was already reviewed or could not be updated"
        )

    return {
        "message": f"Request {request.decision}",
        "approval": result.data[0]
    }


@app.get("/followup-approvals")
def get_followup_approvals(
    user=Depends(current_user)
):
    allow(user, "admin")

    result = (
        supabase.table("followup_approvals")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "approvals": result.data
    }


# ---------- Notifications ----------

@app.get("/notifications")
def list_notifications(user=Depends(current_user)):
    return (
        db.table("notifications").select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True).execute().data
    )


@app.patch("/notifications/{nid}")
def mark_notification(
    nid: str, body: NotificationRead, user=Depends(current_user)
):
    result = db.table("notifications").update({
        "is_read": body.is_read
    }).eq("id", nid).eq("user_id", user["id"]).execute().data

    if not result:
        fail(404, "Notification not found")
    return result[0]


# ---------- Analytics ----------

@app.get("/analytics")
def analytics(user=Depends(current_user)):
    allow(user, "admin")
    rows = db.table("complaints").select(
        "id,status,priority,category,department_id,created_at,updated_at"
    ).execute().data

    counts = Counter(row["status"] for row in rows)
    categories = Counter(row["category"] for row in rows)

    now = datetime.now(timezone.utc)
    durations = []
    for row in rows:
        if row["status"] in {"resolved", "closed"}:
            try:
                start = datetime.fromisoformat(
                    row["created_at"].replace("Z", "+00:00")
                )
                end = datetime.fromisoformat(
                    row["updated_at"].replace("Z", "+00:00")
                )
                durations.append((end - start).total_seconds() / 3600)
            except (ValueError, TypeError):
                pass

    overdue = db.table("complaints").select("id", count="exact").lt(
        "due_at", now.isoformat()
    ).not_.in_("status", ["resolved", "closed", "cancelled", "rejected"]).execute()

    return {
        "total_complaints": len(rows),
        "status_counts": dict(counts),
        "category_counts": dict(categories),
        "overdue_count": overdue.count or 0,
        "average_resolution_hours": (
            round(sum(durations) / len(durations), 2)
            if durations else 0
        )
    }
