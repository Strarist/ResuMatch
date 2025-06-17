from fastapi import APIRouter
from typing import Dict, str

router = APIRouter()

@router.get("/analysis/ping")
def ping() -> Dict[str, str]:
    return {"message": "analysis endpoint available"} 