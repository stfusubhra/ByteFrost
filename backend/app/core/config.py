from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "ByteFrost"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bytefrost"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    # In production the SECRET_KEY MUST be set via environment variable.
    # The insecure default is only acceptable for local development.
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Google Maps
    GOOGLE_MAPS_API_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    def validate_security(self) -> None:
        """Fail fast in production if the secret key is the insecure default."""
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env in {"production", "prod"} and self.SECRET_KEY == "change-me-in-production":
            raise RuntimeError(
                "SECRET_KEY must be set to a strong random value in production. "
                "Set the SECRET_KEY environment variable before starting the server."
            )


settings = Settings()
settings.validate_security()
