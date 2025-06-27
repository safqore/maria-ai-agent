# SQLAlchemy ORM Integration

This document provides an overview of how SQLAlchemy Object-Relational Mapping (ORM) is integrated into the Maria AI Agent application.

## Overview

SQLAlchemy is a SQL toolkit and Object-Relational Mapping (ORM) library for Python that provides a flexible approach to database interaction. It allows you to work with database objects using Python classes and methods instead of writing raw SQL.

## Key Components

### 1. Database Configuration (`app/database.py`)

This module sets up the SQLAlchemy engine, session management, and declarative base:

```python
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Base class for models
Base = declarative_base()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db_session() -> Session:
    """Context manager for database sessions."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
```

### 2. Models (`app/models.py`)

Models define the database schema using Python classes that inherit from the SQLAlchemy `Base` class:

```python
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    uuid = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(Text, nullable=False)
    # ... other fields
```

### 3. Repositories (`app/repositories/`)

Repository classes provide an abstraction layer for database operations, making it easier to test and maintain the application:

```python
class UserSessionRepository:
    @staticmethod
    def get_by_uuid(session_uuid: str) -> Optional[UserSession]:
        with get_db_session() as session:
            return session.query(UserSession).filter(
                UserSession.uuid == session_uuid
            ).first()
```

### 4. Services (`app/services/`)

Service classes use the repositories to implement business logic:

```python
class SessionService:
    @staticmethod
    def check_uuid_exists(session_uuid: str) -> bool:
        return UserSessionRepository.exists(session_uuid)
```

## Usage Patterns

### Creating new records

```python
user_session = UserSessionRepository.create(
    session_uuid=uuid.uuid4(),
    name="User Name",
    email="user@example.com"
)
```

### Retrieving records

```python
user_session = UserSessionRepository.get_by_uuid(session_uuid)
if user_session:
    # Do something with user_session
```

### Updating records

```python
UserSessionRepository.update(
    session_uuid=uuid_str,
    data={"name": "New Name", "email": "new@example.com"}
)
```

### Deleting records

```python
success = UserSessionRepository.delete(session_uuid)
```

## Database Migrations

The project uses Alembic for database migrations:

1. Create a new migration: `alembic revision --autogenerate -m "description"`
2. Run migrations: `alembic upgrade head`
3. Revert migrations: `alembic downgrade -1`

## Best Practices

1. **Use Repositories**: Don't access the database directly from services or routes
2. **Context Managers**: Always use the `get_db_session()` context manager to ensure proper session handling
3. **Error Handling**: Catch and handle SQLAlchemy errors appropriately
4. **Migrations**: Create migrations for all schema changes
5. **Type Hints**: Use type hints for better IDE support and code quality

## Transitioning from Direct Database Access

This project is transitioning from direct psycopg2 connections to SQLAlchemy ORM. During the transition:

1. New code should use SQLAlchemy ORM
2. Legacy code using `get_db_connection()` will continue to work
3. Gradually refactor legacy code to use the repository pattern
