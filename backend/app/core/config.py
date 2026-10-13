"""Application configuration using Pydantic Settings."""
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FeedbackPilot"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    POSTGRES_USER: str = "feedbackpilot"
    POSTGRES_PASSWORD: str = "feedbackpilot_secret_pass"
    POSTGRES_DB: str = "feedbackpilot"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = (
        "postgresql+asyncpg://feedbackpilot:feedbackpilot_secret_pass@localhost:5432/feedbackpilot"
    )

    JWT_SECRET_KEY: str = "feedbackpilot_dev_secret_key_32_chars_long_minimum!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    INITIAL_ADMIN_EMAIL: str = "admin@feedbackpilot.io"
    INITIAL_ADMIN_PASSWORD: str = "AdminSecurePass2026!"
    INITIAL_ADMIN_NAME: str = "FeedbackPilot Administrator"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    AI_ENABLED: bool = True
    AI_MAX_RETRIES: int = 3
    AI_TIMEOUT_SECONDS: int = 15

    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [str(v)]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
