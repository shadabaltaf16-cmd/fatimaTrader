from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Pydantic Models
class Customer(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str

class CustomerCreate(BaseModel):
    name: str
    phone: str

class Entry(BaseModel):
    id: Optional[str] = None
    customer_id: str
    customer_name: str
    date: str
    nos: int
    weight: float
    rate: float
    total: float

class EntryCreate(BaseModel):
    customer_id: str
    customer_name: str
    date: str
    nos: int
    weight: float
    rate: float
    total: float

class Payment(BaseModel):
    id: Optional[str] = None
    customer_id: str
    customer_name: str
    amount: float
    date: str
    note: Optional[str] = None

class PaymentCreate(BaseModel):
    customer_id: str
    customer_name: str
    amount: float
    date: str
    note: Optional[str] = None

class Bill(BaseModel):
    id: Optional[str] = None
    customer_id: str
    customer_name: str
    week_start: str
    week_end: str
    entries: List[Entry]
    grand_total: float
    total_paid: float
    balance: float
    status: str
    generated_date: str

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# Customer Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    customer_dict = customer.dict()
    result = await db.customers.insert_one(customer_dict)
    customer_dict["id"] = str(result.inserted_id)
    return Customer(**customer_dict)

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find().to_list(1000)
    return [Customer(**serialize_doc(customer)) for customer in customers]

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"_id": ObjectId(customer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# Entry Routes
@api_router.post("/entries", response_model=Entry)
async def create_entry(entry: EntryCreate):
    entry_dict = entry.dict()
    result = await db.entries.insert_one(entry_dict)
    entry_dict["id"] = str(result.inserted_id)
    return Entry(**entry_dict)

@api_router.get("/entries", response_model=List[Entry])
async def get_entries(customer_id: Optional[str] = None):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    entries = await db.entries.find(query).sort("date", -1).to_list(1000)
    return [Entry(**serialize_doc(entry)) for entry in entries]

@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str):
    result = await db.entries.delete_one({"_id": ObjectId(entry_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted successfully"}

# Payment Routes
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate):
    payment_dict = payment.dict()
    result = await db.payments.insert_one(payment_dict)
    payment_dict["id"] = str(result.inserted_id)
    return Payment(**payment_dict)

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(customer_id: Optional[str] = None):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    payments = await db.payments.find(query).sort("date", -1).to_list(1000)
    return [Payment(**serialize_doc(payment)) for payment in payments]

# Bill Routes
@api_router.get("/bills/current-week")
async def get_current_week_bills():
    # Calculate current week (Tuesday to Sunday)
    today = datetime.now()
    # Find the most recent Tuesday
    days_since_tuesday = (today.weekday() - 1) % 7
    week_start = today - timedelta(days=days_since_tuesday)
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=5)  # Sunday
    
    week_start_str = week_start.strftime("%Y-%m-%d")
    week_end_str = week_end.strftime("%Y-%m-%d")
    
    # Get all entries for current week
    entries = await db.entries.find({
        "date": {"$gte": week_start_str, "$lte": week_end_str}
    }).to_list(1000)
    
    # Group by customer
    customer_bills = {}
    for entry in entries:
        cid = entry["customer_id"]
        if cid not in customer_bills:
            customer_bills[cid] = {
                "customer_id": cid,
                "customer_name": entry["customer_name"],
                "entries": [],
                "grand_total": 0
            }
        customer_bills[cid]["entries"].append(Entry(**serialize_doc(entry)))
        customer_bills[cid]["grand_total"] += entry["total"]
    
    # Add payment information
    for cid in customer_bills:
        payments = await db.payments.find({
            "customer_id": cid,
            "date": {"$gte": week_start_str, "$lte": week_end_str}
        }).to_list(1000)
        total_paid = sum([p["amount"] for p in payments])
        customer_bills[cid]["total_paid"] = total_paid
        customer_bills[cid]["balance"] = customer_bills[cid]["grand_total"] - total_paid
    
    return {
        "week_start": week_start_str,
        "week_end": week_end_str,
        "bills": list(customer_bills.values())
    }

@api_router.post("/bills/generate")
async def generate_bill(customer_id: str, week_start: str, week_end: str):
    # Get entries for the week
    entries = await db.entries.find({
        "customer_id": customer_id,
        "date": {"$gte": week_start, "$lte": week_end}
    }).to_list(1000)
    
    if not entries:
        raise HTTPException(status_code=404, detail="No entries found for this period")
    
    # Calculate totals
    grand_total = sum([e["total"] for e in entries])
    
    # Get payments
    payments = await db.payments.find({
        "customer_id": customer_id,
        "date": {"$gte": week_start, "$lte": week_end}
    }).to_list(1000)
    total_paid = sum([p["amount"] for p in payments])
    
    # Create bill
    bill = {
        "customer_id": customer_id,
        "customer_name": entries[0]["customer_name"],
        "week_start": week_start,
        "week_end": week_end,
        "entries": [Entry(**serialize_doc(e)) for e in entries],
        "grand_total": grand_total,
        "total_paid": total_paid,
        "balance": grand_total - total_paid,
        "status": "paid" if grand_total <= total_paid else "unpaid",
        "generated_date": datetime.now().strftime("%Y-%m-%d")
    }
    
    result = await db.bills.insert_one({k: v for k, v in bill.items() if k != "entries"} | {"entries": [serialize_doc(e.dict()) for e in bill["entries"]]})
    bill["id"] = str(result.inserted_id)
    
    return Bill(**bill)

@api_router.get("/bills/past", response_model=List[Bill])
async def get_past_bills():
    bills = await db.bills.find().sort("generated_date", -1).to_list(1000)
    result = []
    for bill in bills:
        bill = serialize_doc(bill)
        bill["entries"] = [Entry(**e) for e in bill.get("entries", [])]
        result.append(Bill(**bill))
    return result

@api_router.get("/")
async def root():
    return {"message": "Fatima Trader API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
