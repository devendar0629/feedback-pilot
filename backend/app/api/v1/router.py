"""Aggregated v1 API Router."""
from fastapi import APIRouter
from app.api.v1.admin import router as admin_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.auth import router as auth_router
from app.api.v1.categories import router as categories_router
from app.api.v1.comments import router as comments_router
from app.api.v1.departments import router as departments_router
from app.api.v1.feedbacks import router as feedbacks_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.public_feedback import router as public_router
from app.api.v1.users import router as users_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(public_router)
api_v1_router.include_router(feedbacks_router)
api_v1_router.include_router(comments_router)
api_v1_router.include_router(departments_router)
api_v1_router.include_router(categories_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(admin_router)
