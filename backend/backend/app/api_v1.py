from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, status, Request, Response, Depends
from fastapi.responses import JSONResponse
import os
import uuid
from .tasks import process_pdf
from PyPDF2 import PdfReader
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_db
from .models import User
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/v1", tags=["Resumes"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_PDF_PAGES = 20
MAX_TEXT_SIZE = 50 * 1024  # 50KB

config = Config('.env')
oauth = OAuth(config)

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

JWT_SECRET = os.getenv('JWT_SECRET', 'changeme')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def create_jwt(user):
    payload = {
        'sub': str(user.id),
        'email': user.email,
        'provider': user.provider,
        'exp': datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@router.post("/resumes", status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(file: UploadFile = File(...)):
    # Magic number check: first 4 bytes must be %PDF
    first_bytes = await file.read(4)
    if first_bytes != b'%PDF':
        raise HTTPException(status_code=400, detail="File is not a valid PDF (magic number mismatch)")
    # MIME type check
    if file.content_type not in ["application/pdf", "application/x-pdf"]:
        raise HTTPException(status_code=400, detail="File MIME type is not PDF")
    # Read the rest of the file
    file_bytes = first_bytes + await file.read()
    # Structural validation and sanitization
    try:
        from io import BytesIO
        pdf = PdfReader(BytesIO(file_bytes))
        num_pages = len(pdf.pages)
        if num_pages > MAX_PDF_PAGES:
            raise HTTPException(status_code=400, detail=f"PDF exceeds max page limit of {MAX_PDF_PAGES}")
        # Extract text, limit to 50KB
        extracted_text = ""
        for page in pdf.pages:
            if len(extracted_text) > MAX_TEXT_SIZE:
                break
            extracted_text += page.extract_text() or ""
        if len(extracted_text.encode('utf-8')) > MAX_TEXT_SIZE:
            raise HTTPException(status_code=400, detail="PDF text content exceeds 50KB limit")
        # Check for JavaScript or embedded files (basic check)
        if "/JavaScript" in str(pdf) or "/JS" in str(pdf):
            raise HTTPException(status_code=400, detail="PDF contains JavaScript, which is not allowed")
        if any("/EmbeddedFile" in str(obj) for obj in pdf.pages):
            raise HTTPException(status_code=400, detail="PDF contains embedded files, which are not allowed")
        # Deep sanitization with pikepdf
        import pikepdf
        try:
            with pikepdf.open(BytesIO(file_bytes)) as pdf_sanitized:
                # Remove all JavaScript actions
                pdf_sanitized.remove_javascript()
                # Remove embedded files
                if "/Names" in pdf_sanitized.root:
                    names = pdf_sanitized.root["/Names"]
                    if "/EmbeddedFiles" in names:
                        del names["/EmbeddedFiles"]
                # Remove any /AA (additional actions)
                if "/AA" in pdf_sanitized.root:
                    del pdf_sanitized.root["/AA"]
                # Save sanitized PDF to bytes
                from io import BytesIO as _BytesIO
                sanitized_bytes_io = _BytesIO()
                pdf_sanitized.save(sanitized_bytes_io)
                sanitized_bytes = sanitized_bytes_io.getvalue()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF sanitization failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF parsing failed: {str(e)}")
    # Save sanitized file to disk
    resume_id = uuid.uuid4().hex
    file_path = os.path.join(UPLOAD_DIR, f"{resume_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(sanitized_bytes)
    # Queue Celery task
    process_pdf.delay(resume_id, file_path)
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"message": "Resume upload accepted for processing", "resume_id": resume_id}
    )

@router.get('/auth/google/login')
async def google_login(request: Request):
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:8000/auth/google/callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get('/auth/google/callback')
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == user_info['email']))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            name=user_info.get('name'),
            email=user_info.get('email'),
            provider='google',
            profile_img=user_info.get('picture')
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    jwt_token = create_jwt(user)
    response = JSONResponse({"message": "Google login successful", "user": {"id": user.id, "name": user.name, "email": user.email, "profile_img": user.profile_img}})
    response.set_cookie(key="access_token", value=jwt_token, httponly=True, secure=True, samesite="lax")
    return response 