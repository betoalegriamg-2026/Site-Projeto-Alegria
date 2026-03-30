from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    JWT_SECRET = os.urandom(32).hex()
    logger.warning("JWT_SECRET not set in environment, using random secret (sessions will not persist across restarts)")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Projeto Alegria API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "responsible"  # admin, responsible

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    created_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class StudentBase(BaseModel):
    name: str
    birth_date: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    mother_name: Optional[str] = None
    father_name: Optional[str] = None
    sex: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    profession: Optional[str] = None
    medical_conditions: Optional[str] = None
    responsible_id: Optional[str] = None
    status: str = "active"  # active, suspended, inactive

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str
    updated_at: Optional[str] = None

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    instructor: Optional[str] = None
    schedule: Optional[str] = None
    days_of_week: List[str] = []
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    max_students: int = 30
    monthly_fee: float = 0.0
    age_group: Optional[str] = None
    status: str = "active"

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str
    enrolled_count: int = 0

class EnrollmentBase(BaseModel):
    student_id: str
    class_id: str
    status: str = "active"  # active, suspended, cancelled

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentResponse(EnrollmentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    enrollment_date: str
    student_name: Optional[str] = None
    class_name: Optional[str] = None

class AttendanceBase(BaseModel):
    enrollment_id: str
    date: str
    status: str  # P (present), F (absent), FJ (justified absence)
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    student_name: Optional[str] = None
    class_name: Optional[str] = None

class AttendanceBulkCreate(BaseModel):
    class_id: str
    date: str
    records: List[dict]  # [{enrollment_id, status, notes}]

class PaymentBase(BaseModel):
    student_id: str
    class_id: Optional[str] = None
    amount: float
    payment_date: str
    reference_month: str
    payment_method: str = "cash"  # cash, pix, card, transfer
    status: str = "paid"  # pending, paid, cancelled
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str
    student_name: Optional[str] = None

class CashFlowBase(BaseModel):
    type: str  # income, expense
    category: str
    description: str
    amount: float
    due_date: str
    payment_date: Optional[str] = None
    status: str = "pending"  # pending, paid, cancelled
    notes: Optional[str] = None

class CashFlowCreate(CashFlowBase):
    pass

class CashFlowResponse(CashFlowBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class ProjectBase(BaseModel):
    title: str
    description: str
    image_url: Optional[str] = None
    date: Optional[str] = None
    status: str = "active"

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

class GalleryImage(BaseModel):
    url: str
    caption: Optional[str] = None
    category: Optional[str] = None

class GalleryImageCreate(BaseModel):
    url: str
    caption: Optional[str] = None
    category: Optional[str] = None
    order: int = 0

class GalleryImageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    url: str
    caption: Optional[str] = None
    category: Optional[str] = None
    order: int = 0
    created_at: str

class SiteSettingsBase(BaseModel):
    # Hero Section
    hero_title: str = "Transformando Vidas através da Arte e Cultura"
    hero_subtitle: str = "Oferecemos aulas de dança, teatro, música e artes para crianças e jovens em situação de vulnerabilidade social."
    hero_image: Optional[str] = None
    hero_badge: str = "Transformando vidas desde 2021"
    
    # About Section
    about_title: str = "Levando arte, cultura e esperança para comunidades"
    about_description: str = "O Projeto Alegria nasceu em 2021 com o propósito de transformar a vida de crianças e jovens em situação de vulnerabilidade social através da arte e da cultura."
    about_description_2: str = "Acreditamos que a arte tem o poder de desenvolver habilidades, fortalecer a autoestima, promover a inclusão social e abrir portas para um futuro melhor."
    about_image: Optional[str] = None
    mission: str = "Promover o desenvolvimento integral de crianças e jovens através do acesso a atividades artísticas e culturais de qualidade."
    vision: str = "Ser referência em educação artística e cultural, contribuindo para a formação de cidadãos críticos e criativos."
    years_active: int = 5
    
    # Contact Info
    address: str = "Rua da Alegria, 123 - Centro"
    city: str = "São Paulo - SP"
    zipcode: str = "01234-567"
    phone: str = "(11) 98765-4321"
    phone_2: Optional[str] = "(11) 3456-7890"
    email: str = "contato@projetoalegria.org"
    whatsapp: Optional[str] = None
    
    # Hours
    hours_weekday: str = "Segunda a Sexta: 8h às 18h"
    hours_weekend: str = "Sábado: 9h às 13h"
    
    # Social Media
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None
    twitter: Optional[str] = None
    
    # Footer
    footer_text: str = "Transformando vidas através da arte e cultura desde 2021."

class SiteSettingsUpdate(SiteSettingsBase):
    pass

class SiteSettingsResponse(SiteSettingsBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    updated_at: str

class TestimonialBase(BaseModel):
    name: str
    role: str
    content: str
    avatar_url: Optional[str] = None
    status: str = "active"

class TestimonialCreate(TestimonialBase):
    pass

class TestimonialResponse(TestimonialBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: str

class DashboardStats(BaseModel):
    total_students: int
    active_students: int
    total_classes: int
    active_enrollments: int
    pending_payments: float
    monthly_income: float
    monthly_expenses: float
    attendance_rate: float

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "password": hash_password(user.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.email, user.role)
    user_response = UserResponse(
        id=user_id,
        email=user.email,
        name=user.name,
        role=user.role,
        created_at=user_doc["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user["role"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== STUDENTS ROUTES ====================

@api_router.post("/students", response_model=StudentResponse)
async def create_student(student: StudentCreate, user: dict = Depends(get_current_user)):
    student_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": student_id,
        **student.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    await db.students.insert_one(doc)
    return StudentResponse(**doc)

@api_router.get("/students", response_model=List[StudentResponse])
async def list_students(
    status: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    students = await db.students.find(query, {"_id": 0}).to_list(1000)
    return [StudentResponse(**s) for s in students]

@api_router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentResponse(**student)

@api_router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student: StudentCreate, user: dict = Depends(get_current_user)):
    existing = await db.students.find_one({"id": student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.students.update_one({"id": student_id}, {"$set": update_data})
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return StudentResponse(**updated)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, user: dict = Depends(require_admin)):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted"}

# ==================== CLASSES ROUTES ====================

@api_router.post("/classes", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, user: dict = Depends(require_admin)):
    class_id = str(uuid.uuid4())
    doc = {
        "id": class_id,
        **class_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.classes.insert_one(doc)
    return ClassResponse(**doc, enrolled_count=0)

@api_router.get("/classes", response_model=List[ClassResponse])
async def list_classes(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    
    classes = await db.classes.find(query, {"_id": 0}).to_list(100)
    
    # Batch query for enrollment counts using aggregation
    class_ids = [c["id"] for c in classes]
    enrollment_counts = {}
    
    if class_ids:
        pipeline = [
            {"$match": {"class_id": {"$in": class_ids}, "status": "active"}},
            {"$group": {"_id": "$class_id", "count": {"$sum": 1}}}
        ]
        counts = await db.enrollments.aggregate(pipeline).to_list(100)
        enrollment_counts = {c["_id"]: c["count"] for c in counts}
    
    result = []
    for c in classes:
        count = enrollment_counts.get(c["id"], 0)
        result.append(ClassResponse(**c, enrolled_count=count))
    return result

@api_router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(class_id: str):
    cls = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    count = await db.enrollments.count_documents({"class_id": class_id, "status": "active"})
    return ClassResponse(**cls, enrolled_count=count)

@api_router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(class_id: str, class_data: ClassCreate, user: dict = Depends(require_admin)):
    existing = await db.classes.find_one({"id": class_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Class not found")
    
    await db.classes.update_one({"id": class_id}, {"$set": class_data.model_dump()})
    updated = await db.classes.find_one({"id": class_id}, {"_id": 0})
    count = await db.enrollments.count_documents({"class_id": class_id, "status": "active"})
    return ClassResponse(**updated, enrolled_count=count)

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, user: dict = Depends(require_admin)):
    result = await db.classes.delete_one({"id": class_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class deleted"}

# ==================== ENROLLMENTS ROUTES ====================

@api_router.post("/enrollments", response_model=EnrollmentResponse)
async def create_enrollment(enrollment: EnrollmentCreate, user: dict = Depends(get_current_user)):
    # Check if already enrolled
    existing = await db.enrollments.find_one({
        "student_id": enrollment.student_id,
        "class_id": enrollment.class_id,
        "status": "active"
    })
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this class")
    
    enrollment_id = str(uuid.uuid4())
    doc = {
        "id": enrollment_id,
        **enrollment.model_dump(),
        "enrollment_date": datetime.now(timezone.utc).isoformat()
    }
    await db.enrollments.insert_one(doc)
    
    student = await db.students.find_one({"id": enrollment.student_id}, {"_id": 0, "name": 1})
    cls = await db.classes.find_one({"id": enrollment.class_id}, {"_id": 0, "name": 1})
    
    return EnrollmentResponse(
        **doc,
        student_name=student.get("name") if student else None,
        class_name=cls.get("name") if cls else None
    )

@api_router.get("/enrollments", response_model=List[EnrollmentResponse])
async def list_enrollments(
    class_id: Optional[str] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if class_id:
        query["class_id"] = class_id
    if student_id:
        query["student_id"] = student_id
    if status:
        query["status"] = status
    
    enrollments = await db.enrollments.find(query, {"_id": 0}).to_list(1000)
    
    if not enrollments:
        return []
    
    # Batch fetch students and classes
    student_ids = list(set(e["student_id"] for e in enrollments))
    class_ids = list(set(e["class_id"] for e in enrollments))
    
    students = await db.students.find({"id": {"$in": student_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(student_ids))
    classes = await db.classes.find({"id": {"$in": class_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(class_ids))
    
    student_map = {s["id"]: s.get("name") for s in students}
    class_map = {c["id"]: c.get("name") for c in classes}
    
    result = []
    for e in enrollments:
        result.append(EnrollmentResponse(
            **e,
            student_name=student_map.get(e["student_id"]),
            class_name=class_map.get(e["class_id"])
        ))
    return result

@api_router.put("/enrollments/{enrollment_id}", response_model=EnrollmentResponse)
async def update_enrollment(enrollment_id: str, enrollment: EnrollmentCreate, user: dict = Depends(get_current_user)):
    existing = await db.enrollments.find_one({"id": enrollment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    await db.enrollments.update_one({"id": enrollment_id}, {"$set": enrollment.model_dump()})
    updated = await db.enrollments.find_one({"id": enrollment_id}, {"_id": 0})
    
    student = await db.students.find_one({"id": updated["student_id"]}, {"_id": 0, "name": 1})
    cls = await db.classes.find_one({"id": updated["class_id"]}, {"_id": 0, "name": 1})
    
    return EnrollmentResponse(
        **updated,
        student_name=student.get("name") if student else None,
        class_name=cls.get("name") if cls else None
    )

# ==================== ATTENDANCE ROUTES ====================

@api_router.post("/attendance/bulk")
async def create_attendance_bulk(data: AttendanceBulkCreate, user: dict = Depends(get_current_user)):
    created = []
    for record in data.records:
        # Check if attendance already exists for this date
        existing = await db.attendance.find_one({
            "enrollment_id": record["enrollment_id"],
            "date": data.date
        })
        
        if existing:
            # Update existing
            await db.attendance.update_one(
                {"id": existing["id"]},
                {"$set": {"status": record["status"], "notes": record.get("notes")}}
            )
        else:
            # Create new
            attendance_id = str(uuid.uuid4())
            doc = {
                "id": attendance_id,
                "enrollment_id": record["enrollment_id"],
                "date": data.date,
                "status": record["status"],
                "notes": record.get("notes"),
                "class_id": data.class_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.attendance.insert_one(doc)
            created.append(doc)
    
    return {"message": f"Attendance recorded for {len(data.records)} students"}

@api_router.get("/attendance", response_model=List[AttendanceResponse])
async def list_attendance(
    class_id: Optional[str] = None,
    enrollment_id: Optional[str] = None,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if class_id:
        query["class_id"] = class_id
    if enrollment_id:
        query["enrollment_id"] = enrollment_id
    if date:
        query["date"] = date
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    records = await db.attendance.find(query, {"_id": 0}).to_list(5000)
    
    if not records:
        return []
    
    # Batch fetch enrollments, students, and classes
    enrollment_ids = list(set(r["enrollment_id"] for r in records))
    enrollments = await db.enrollments.find({"id": {"$in": enrollment_ids}}, {"_id": 0}).to_list(len(enrollment_ids))
    enrollment_map = {e["id"]: e for e in enrollments}
    
    student_ids = list(set(e.get("student_id") for e in enrollments if e.get("student_id")))
    class_ids = list(set(e.get("class_id") for e in enrollments if e.get("class_id")))
    
    students = await db.students.find({"id": {"$in": student_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(student_ids)) if student_ids else []
    classes = await db.classes.find({"id": {"$in": class_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(class_ids)) if class_ids else []
    
    student_map = {s["id"]: s.get("name") for s in students}
    class_map = {c["id"]: c.get("name") for c in classes}
    
    result = []
    for r in records:
        enrollment = enrollment_map.get(r["enrollment_id"], {})
        student_name = student_map.get(enrollment.get("student_id"))
        class_name = class_map.get(enrollment.get("class_id"))
        
        result.append(AttendanceResponse(
            id=r["id"],
            enrollment_id=r["enrollment_id"],
            date=r["date"],
            status=r["status"],
            notes=r.get("notes"),
            student_name=student_name,
            class_name=class_name
        ))
    return result

# ==================== PAYMENTS ROUTES ====================

@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, user: dict = Depends(get_current_user)):
    payment_id = str(uuid.uuid4())
    doc = {
        "id": payment_id,
        **payment.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(doc)
    
    student = await db.students.find_one({"id": payment.student_id}, {"_id": 0, "name": 1})
    return PaymentResponse(**doc, student_name=student.get("name") if student else None)

@api_router.get("/payments", response_model=List[PaymentResponse])
async def list_payments(
    student_id: Optional[str] = None,
    class_id: Optional[str] = None,
    status: Optional[str] = None,
    reference_month: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if student_id:
        query["student_id"] = student_id
    if class_id:
        query["class_id"] = class_id
    if status:
        query["status"] = status
    if reference_month:
        query["reference_month"] = reference_month
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    
    if not payments:
        return []
    
    # Batch fetch students
    student_ids = list(set(p["student_id"] for p in payments))
    students = await db.students.find({"id": {"$in": student_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(len(student_ids))
    student_map = {s["id"]: s.get("name") for s in students}
    
    result = []
    for p in payments:
        result.append(PaymentResponse(**p, student_name=student_map.get(p["student_id"])))
    return result

@api_router.put("/payments/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: str, payment: PaymentCreate, user: dict = Depends(get_current_user)):
    existing = await db.payments.find_one({"id": payment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await db.payments.update_one({"id": payment_id}, {"$set": payment.model_dump()})
    updated = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    
    student = await db.students.find_one({"id": updated["student_id"]}, {"_id": 0, "name": 1})
    return PaymentResponse(**updated, student_name=student.get("name") if student else None)

# ==================== CASH FLOW ROUTES ====================

@api_router.post("/cashflow", response_model=CashFlowResponse)
async def create_cashflow(entry: CashFlowCreate, user: dict = Depends(require_admin)):
    entry_id = str(uuid.uuid4())
    doc = {
        "id": entry_id,
        **entry.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cashflow.insert_one(doc)
    return CashFlowResponse(**doc)

@api_router.get("/cashflow", response_model=List[CashFlowResponse])
async def list_cashflow(
    type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if start_date and end_date:
        query["due_date"] = {"$gte": start_date, "$lte": end_date}
    
    entries = await db.cashflow.find(query, {"_id": 0}).to_list(1000)
    return [CashFlowResponse(**e) for e in entries]

@api_router.put("/cashflow/{entry_id}", response_model=CashFlowResponse)
async def update_cashflow(entry_id: str, entry: CashFlowCreate, user: dict = Depends(require_admin)):
    existing = await db.cashflow.find_one({"id": entry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    await db.cashflow.update_one({"id": entry_id}, {"$set": entry.model_dump()})
    updated = await db.cashflow.find_one({"id": entry_id}, {"_id": 0})
    return CashFlowResponse(**updated)

@api_router.delete("/cashflow/{entry_id}")
async def delete_cashflow(entry_id: str, user: dict = Depends(require_admin)):
    result = await db.cashflow.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}

# ==================== REPORTS ROUTES ====================

@api_router.get("/reports/class/{class_id}")
async def get_class_report(class_id: str, month: Optional[str] = None, user: dict = Depends(get_current_user)):
    cls = await db.classes.find_one({"id": class_id}, {"_id": 0})
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get enrollments
    enrollments = await db.enrollments.find({"class_id": class_id, "status": "active"}, {"_id": 0}).to_list(100)
    
    if not enrollments:
        return {"class": cls, "enrolled_count": 0, "students": []}
    
    # Batch fetch all students
    student_ids = [e["student_id"] for e in enrollments]
    enrollment_ids = [e["id"] for e in enrollments]
    
    students = await db.students.find({"id": {"$in": student_ids}}, {"_id": 0}).to_list(len(student_ids))
    student_map = {s["id"]: s for s in students}
    
    # Batch fetch attendance for all enrollments
    attendance_query = {"enrollment_id": {"$in": enrollment_ids}}
    if month:
        attendance_query["date"] = {"$regex": f"^{month}"}
    all_attendance = await db.attendance.find(attendance_query, {"_id": 0, "enrollment_id": 1, "status": 1}).to_list(5000)
    
    # Group attendance by enrollment
    attendance_by_enrollment = {}
    for a in all_attendance:
        eid = a["enrollment_id"]
        if eid not in attendance_by_enrollment:
            attendance_by_enrollment[eid] = []
        attendance_by_enrollment[eid].append(a)
    
    # Batch fetch payments for all students in this class
    payment_query = {"student_id": {"$in": student_ids}, "class_id": class_id}
    if month:
        payment_query["reference_month"] = month
    all_payments = await db.payments.find(payment_query, {"_id": 0, "student_id": 1, "amount": 1, "status": 1}).to_list(1000)
    
    # Group payments by student
    payments_by_student = {}
    for p in all_payments:
        sid = p["student_id"]
        if sid not in payments_by_student:
            payments_by_student[sid] = []
        payments_by_student[sid].append(p)
    
    students_data = []
    for e in enrollments:
        student = student_map.get(e["student_id"])
        if not student:
            continue
        
        # Attendance stats
        attendance = attendance_by_enrollment.get(e["id"], [])
        total_classes = len(attendance)
        present = len([a for a in attendance if a["status"] == "P"])
        absent = len([a for a in attendance if a["status"] == "F"])
        justified = len([a for a in attendance if a["status"] == "FJ"])
        
        # Payment stats
        payments = payments_by_student.get(e["student_id"], [])
        total_paid = sum(p["amount"] for p in payments if p["status"] == "paid")
        pending_payments = [p for p in payments if p["status"] == "pending"]
        
        students_data.append({
            "student": student,
            "enrollment": e,
            "attendance": {
                "total_classes": total_classes,
                "present": present,
                "absent": absent,
                "justified": justified,
                "rate": round((present / total_classes * 100) if total_classes > 0 else 0, 1)
            },
            "payments": {
                "total_paid": total_paid,
                "pending_count": len(pending_payments),
                "pending_amount": sum(p["amount"] for p in pending_payments)
            }
        })
    
    return {
        "class": cls,
        "enrolled_count": len(enrollments),
        "students": students_data
    }

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    # Students
    total_students = await db.students.count_documents({})
    active_students = await db.students.count_documents({"status": "active"})
    
    # Classes
    total_classes = await db.classes.count_documents({"status": "active"})
    
    # Enrollments
    active_enrollments = await db.enrollments.count_documents({"status": "active"})
    
    # Payments this month
    current_month = datetime.now().strftime("%Y-%m")
    payments = await db.payments.find({"reference_month": current_month}, {"_id": 0}).to_list(1000)
    pending_payments = sum(p["amount"] for p in payments if p["status"] == "pending")
    monthly_income = sum(p["amount"] for p in payments if p["status"] == "paid")
    
    # Expenses this month
    expenses = await db.cashflow.find({
        "type": "expense",
        "due_date": {"$regex": f"^{current_month}"},
        "status": "paid"
    }, {"_id": 0}).to_list(1000)
    monthly_expenses = sum(e["amount"] for e in expenses)
    
    # Attendance rate this month
    attendance = await db.attendance.find({"date": {"$regex": f"^{current_month}"}}, {"_id": 0}).to_list(5000)
    total_attendance = len(attendance)
    present = len([a for a in attendance if a["status"] == "P"])
    attendance_rate = round((present / total_attendance * 100) if total_attendance > 0 else 0, 1)
    
    return DashboardStats(
        total_students=total_students,
        active_students=active_students,
        total_classes=total_classes,
        active_enrollments=active_enrollments,
        pending_payments=pending_payments,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        attendance_rate=attendance_rate
    )

# ==================== PUBLIC ROUTES ====================

@api_router.get("/public/classes", response_model=List[ClassResponse])
async def list_public_classes():
    classes = await db.classes.find({"status": "active"}, {"_id": 0}).to_list(100)
    
    if not classes:
        return []
    
    # Batch query for enrollment counts using aggregation
    class_ids = [c["id"] for c in classes]
    pipeline = [
        {"$match": {"class_id": {"$in": class_ids}, "status": "active"}},
        {"$group": {"_id": "$class_id", "count": {"$sum": 1}}}
    ]
    counts = await db.enrollments.aggregate(pipeline).to_list(100)
    enrollment_counts = {c["_id"]: c["count"] for c in counts}
    
    result = []
    for c in classes:
        count = enrollment_counts.get(c["id"], 0)
        result.append(ClassResponse(**c, enrolled_count=count))
    return result

@api_router.get("/public/stats")
async def get_public_stats():
    total_students = await db.students.count_documents({"status": "active"})
    total_classes = await db.classes.count_documents({"status": "active"})
    
    # Get years_active from settings
    settings = await db.site_settings.find_one({}, {"_id": 0, "years_active": 1})
    years_active = settings.get("years_active", 5) if settings else 5
    
    return {
        "students": total_students if total_students > 0 else 64,
        "classes": total_classes if total_classes > 0 else 8,
        "years": years_active
    }

@api_router.post("/public/contact")
async def submit_contact(message: ContactMessage):
    doc = {
        "id": str(uuid.uuid4()),
        **message.model_dump(),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.contact_messages.insert_one(doc)
    return {"message": "Message sent successfully"}

@api_router.get("/public/projects", response_model=List[ProjectResponse])
async def list_public_projects():
    projects = await db.projects.find({"status": "active"}, {"_id": 0}).to_list(50)
    return [ProjectResponse(**p) for p in projects]

@api_router.get("/public/testimonials", response_model=List[TestimonialResponse])
async def list_public_testimonials():
    testimonials = await db.testimonials.find({"status": "active"}, {"_id": 0}).to_list(50)
    return [TestimonialResponse(**t) for t in testimonials]

# ==================== PROJECTS ROUTES ====================

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, user: dict = Depends(require_admin)):
    project_id = str(uuid.uuid4())
    doc = {
        "id": project_id,
        **project.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(doc)
    return ProjectResponse(**doc)

@api_router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(user: dict = Depends(get_current_user)):
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    return [ProjectResponse(**p) for p in projects]

@api_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectCreate, user: dict = Depends(require_admin)):
    existing = await db.projects.find_one({"id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.update_one({"id": project_id}, {"$set": project.model_dump()})
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return ProjectResponse(**updated)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(require_admin)):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# ==================== TESTIMONIALS ROUTES ====================

@api_router.post("/testimonials", response_model=TestimonialResponse)
async def create_testimonial(testimonial: TestimonialCreate, user: dict = Depends(require_admin)):
    testimonial_id = str(uuid.uuid4())
    doc = {
        "id": testimonial_id,
        **testimonial.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.testimonials.insert_one(doc)
    return TestimonialResponse(**doc)

@api_router.get("/testimonials", response_model=List[TestimonialResponse])
async def list_testimonials(user: dict = Depends(get_current_user)):
    testimonials = await db.testimonials.find({}, {"_id": 0}).to_list(100)
    return [TestimonialResponse(**t) for t in testimonials]

@api_router.put("/testimonials/{testimonial_id}", response_model=TestimonialResponse)
async def update_testimonial(testimonial_id: str, testimonial: TestimonialCreate, user: dict = Depends(require_admin)):
    existing = await db.testimonials.find_one({"id": testimonial_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    await db.testimonials.update_one({"id": testimonial_id}, {"$set": testimonial.model_dump()})
    updated = await db.testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    return TestimonialResponse(**updated)

@api_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, user: dict = Depends(require_admin)):
    result = await db.testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted"}

# ==================== CMS - SITE SETTINGS ====================

@api_router.get("/settings", response_model=SiteSettingsResponse)
async def get_site_settings():
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        # Return default settings
        default = SiteSettingsBase()
        return SiteSettingsResponse(
            id="default",
            updated_at=datetime.now(timezone.utc).isoformat(),
            **default.model_dump()
        )
    return SiteSettingsResponse(**settings)

@api_router.put("/settings", response_model=SiteSettingsResponse)
async def update_site_settings(settings: SiteSettingsUpdate, user: dict = Depends(require_admin)):
    existing = await db.site_settings.find_one({})
    now = datetime.now(timezone.utc).isoformat()
    
    if existing:
        await db.site_settings.update_one(
            {"id": existing["id"]},
            {"$set": {**settings.model_dump(), "updated_at": now}}
        )
        updated = await db.site_settings.find_one({"id": existing["id"]}, {"_id": 0})
    else:
        doc = {
            "id": str(uuid.uuid4()),
            **settings.model_dump(),
            "updated_at": now
        }
        await db.site_settings.insert_one(doc)
        updated = await db.site_settings.find_one({"id": doc["id"]}, {"_id": 0})
    
    return SiteSettingsResponse(**updated)

@api_router.get("/public/settings")
async def get_public_settings():
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        default = SiteSettingsBase()
        return default.model_dump()
    # Remove id and updated_at for public
    return {k: v for k, v in settings.items() if k not in ["id", "updated_at"]}

# ==================== CMS - GALLERY ====================

@api_router.post("/gallery", response_model=GalleryImageResponse)
async def create_gallery_image(image: GalleryImageCreate, user: dict = Depends(require_admin)):
    image_id = str(uuid.uuid4())
    doc = {
        "id": image_id,
        **image.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.gallery.insert_one(doc)
    return GalleryImageResponse(**doc)

@api_router.get("/gallery", response_model=List[GalleryImageResponse])
async def list_gallery_images(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    images = await db.gallery.find(query, {"_id": 0}).sort("order", 1).to_list(200)
    return [GalleryImageResponse(**img) for img in images]

@api_router.put("/gallery/{image_id}", response_model=GalleryImageResponse)
async def update_gallery_image(image_id: str, image: GalleryImageCreate, user: dict = Depends(require_admin)):
    existing = await db.gallery.find_one({"id": image_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Image not found")
    
    await db.gallery.update_one({"id": image_id}, {"$set": image.model_dump()})
    updated = await db.gallery.find_one({"id": image_id}, {"_id": 0})
    return GalleryImageResponse(**updated)

@api_router.delete("/gallery/{image_id}")
async def delete_gallery_image(image_id: str, user: dict = Depends(require_admin)):
    result = await db.gallery.delete_one({"id": image_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted"}

@api_router.get("/public/gallery", response_model=List[GalleryImageResponse])
async def list_public_gallery(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    images = await db.gallery.find(query, {"_id": 0}).sort("order", 1).to_list(200)
    return [GalleryImageResponse(**img) for img in images]

# ==================== CMS - CONTACT MESSAGES ====================

@api_router.get("/messages")
async def list_contact_messages(status: Optional[str] = None, user: dict = Depends(require_admin)):
    query = {}
    if status:
        query["status"] = status
    messages = await db.contact_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return messages

@api_router.put("/messages/{message_id}/status")
async def update_message_status(message_id: str, status: str, user: dict = Depends(require_admin)):
    result = await db.contact_messages.update_one(
        {"id": message_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Status updated"}

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, user: dict = Depends(require_admin)):
    result = await db.contact_messages.delete_one({"id": message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message deleted"}

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "Projeto Alegria API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.students.create_index("id", unique=True)
    await db.classes.create_index("id", unique=True)
    await db.enrollments.create_index("id", unique=True)
    await db.attendance.create_index([("enrollment_id", 1), ("date", 1)])
    await db.payments.create_index("id", unique=True)
    await db.cashflow.create_index("id", unique=True)
    
    # Create default admin if not exists
    admin = await db.users.find_one({"email": "admin@projetoalegria.org"})
    if not admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@projetoalegria.org",
            "name": "Administrador",
            "role": "admin",
            "password": hash_password("admin123"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin user created")
    
    # Seed sample classes if empty
    classes_count = await db.classes.count_documents({})
    if classes_count == 0:
        sample_classes = [
            {"name": "Zumba", "description": "Aulas de dança e exercício aeróbico", "instructor": "Prof. Marília", "days_of_week": ["Segunda", "Quarta"], "start_time": "19:00", "end_time": "20:00", "monthly_fee": 50.0, "age_group": "Adulto"},
            {"name": "Pilates", "description": "Fortalecimento e flexibilidade", "instructor": "Prof. Marília", "days_of_week": ["Terça", "Quinta"], "start_time": "10:00", "end_time": "11:00", "monthly_fee": 60.0, "age_group": "Adulto"},
            {"name": "Natação Infantil 3-6 anos", "description": "Aulas de natação para crianças pequenas", "instructor": "Prof. João", "days_of_week": ["Terça", "Quinta"], "start_time": "16:00", "end_time": "17:00", "monthly_fee": 80.0, "age_group": "3 a 6 anos"},
            {"name": "Natação Infantil 7-12 anos", "description": "Aulas de natação para crianças", "instructor": "Prof. João", "days_of_week": ["Terça", "Quinta"], "start_time": "17:00", "end_time": "18:00", "monthly_fee": 80.0, "age_group": "7 a 12 anos"},
            {"name": "Jiu-Jitsu Infantil", "description": "Artes marciais para crianças", "instructor": "Prof. Ricardo", "days_of_week": ["Segunda", "Quarta", "Sexta"], "start_time": "18:00", "end_time": "19:00", "monthly_fee": 70.0, "age_group": "7 a 14 anos"},
            {"name": "Ballet Infantil", "description": "Dança clássica para crianças", "instructor": "Prof. Ana", "days_of_week": ["Terça", "Quinta"], "start_time": "15:00", "end_time": "16:00", "monthly_fee": 60.0, "age_group": "4 a 10 anos"},
            {"name": "Hidroginástica", "description": "Exercícios aquáticos", "instructor": "Prof. Maria", "days_of_week": ["Segunda", "Quarta", "Sexta"], "start_time": "08:00", "end_time": "09:00", "monthly_fee": 70.0, "age_group": "Adulto"},
            {"name": "Funcional", "description": "Treinamento funcional", "instructor": "Prof. Carlos", "days_of_week": ["Segunda", "Quarta", "Sexta"], "start_time": "07:00", "end_time": "08:00", "monthly_fee": 50.0, "age_group": "Adulto"}
        ]
        
        for cls in sample_classes:
            cls["id"] = str(uuid.uuid4())
            cls["status"] = "active"
            cls["max_students"] = 30
            cls["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.classes.insert_one(cls)
        logger.info("Sample classes created")
    
    # Seed sample testimonials if empty
    testimonials_count = await db.testimonials.count_documents({})
    if testimonials_count == 0:
        sample_testimonials = [
            {"name": "Maria Silva", "role": "Mãe de aluno", "content": "O Projeto Alegria transformou a vida do meu filho. Ele agora é mais confiante e adora as aulas de natação!"},
            {"name": "João Santos", "role": "Aluno de Jiu-Jitsu", "content": "Aprendi muito mais do que técnicas de luta. Aprendi disciplina, respeito e a importância do trabalho em equipe."},
            {"name": "Ana Costa", "role": "Voluntária", "content": "É emocionante ver a alegria das crianças durante as atividades. O projeto realmente faz a diferença na comunidade."}
        ]
        
        for t in sample_testimonials:
            t["id"] = str(uuid.uuid4())
            t["status"] = "active"
            t["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.testimonials.insert_one(t)
        logger.info("Sample testimonials created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
