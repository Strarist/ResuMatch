from fastapi import APIRouter

router = APIRouter()

@router.get("/analysis/ping")
def ping():
    return {"message": "analysis endpoint available"} 