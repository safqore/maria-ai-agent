import os

from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))


class Config:
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION")
    S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

    # Database Configuration - Supports both traditional PostgreSQL and Supabase
    # Priority: DATABASE_URL > Supabase > Traditional PostgreSQL > SQLite fallback

    # Option 1: Full DATABASE_URL (Supabase, Heroku, etc.)
    DATABASE_URL = os.getenv("DATABASE_URL")

    # Option 2: Supabase-specific configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Backend only
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # Frontend safe

    # Option 3: Traditional PostgreSQL (for CI/testing)
    POSTGRES_DB = os.getenv("POSTGRES_DB")
    POSTGRES_USER = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", 5432)

    # Deployment Configuration
    ENVIRONMENT = os.getenv(
        "ENVIRONMENT", "development"
    )  # development, staging, production
    PORT = int(os.getenv("PORT", 5000))

    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    @classmethod
    def get_database_url(cls):
        """
        Get the appropriate database URL based on available configuration.
        Priority: DATABASE_URL > Supabase > Traditional PostgreSQL > SQLite
        """
        # Option 1: Direct DATABASE_URL (highest priority)
        if cls.DATABASE_URL:
            return cls.DATABASE_URL

        # Option 2: Construct from Supabase configuration
        if cls.SUPABASE_URL and cls.SUPABASE_SERVICE_KEY:
            # Extract database details from Supabase URL
            # Format: https://PROJECT_ID.supabase.co
            project_id = cls.SUPABASE_URL.split("//")[1].split(".")[0]
            return f"postgresql://postgres.{project_id}:{cls.SUPABASE_SERVICE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

        # Option 3: Traditional PostgreSQL
        if all(
            [
                cls.POSTGRES_DB,
                cls.POSTGRES_USER,
                cls.POSTGRES_PASSWORD,
                cls.POSTGRES_HOST,
            ]
        ):
            return f"postgresql://{cls.POSTGRES_USER}:{cls.POSTGRES_PASSWORD}@{cls.POSTGRES_HOST}:{cls.POSTGRES_PORT}/{cls.POSTGRES_DB}"

        # Option 4: Fallback to SQLite for local development
        return "sqlite:///maria_ai_dev.db"

    @classmethod
    def is_production(cls):
        """Check if running in production environment."""
        return cls.ENVIRONMENT == "production"

    @classmethod
    def is_staging(cls):
        """Check if running in staging environment."""
        return cls.ENVIRONMENT == "staging"
