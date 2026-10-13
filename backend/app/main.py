"""FastAPI application entrypoint, lifespan events, and middleware."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_v1_router
from app.core.background import start_background_worker, stop_background_worker
from app.core.config import settings
from app.core.exceptions import (
    EntityNotFoundError,
    InvalidStatusTransitionError,
    TrackingVerificationError,
    UnauthorizedAccessError,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager handling startup and shutdown events."""
    start_background_worker()
    yield
    await stop_background_worker()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-Stack AI-Powered Feedback and Complaint Management Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(EntityNotFoundError)
async def entity_not_found_handler(request: Request, exc: EntityNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


@app.exception_handler(InvalidStatusTransitionError)
async def invalid_transition_handler(request: Request, exc: InvalidStatusTransitionError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": str(exc),
            "current_status": exc.current_status,
            "target_status": exc.target_status,
            "allowed_transitions": exc.allowed_transitions,
        },
    )


@app.exception_handler(UnauthorizedAccessError)
async def unauthorized_access_handler(request: Request, exc: UnauthorizedAccessError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc)},
    )


@app.exception_handler(TrackingVerificationError)
async def tracking_verification_handler(request: Request, exc: TrackingVerificationError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "ai_enabled": settings.AI_ENABLED,
    }


app.include_router(api_v1_router, prefix=settings.API_V1_STR)
