# Repository Pattern Enhancement

This document outlines the planned improvements to our SQLAlchemy repository pattern implementation.

## Current Status (June 27, 2025)

The repository pattern has been implemented successfully with a generic `BaseRepository` class and specific `UserSessionRepository` implementation. The current implementation works but could benefit from some enhancements:

1. Improved session management
2. Better transaction handling
3. More consistent error handling
4. Enhanced type safety

## Planned Improvements

### 1. Enhanced Transaction Context Management ✅

A proper transaction context manager has been implemented to ensure database operations are atomic. The implementation is working and has been tested in a standalone example.

```python
class TransactionContext:
    """Context manager for database transactions."""
    
    def __init__(self, session=None):
        """Initialize with optional session."""
        self.session = session or SessionLocal()
        self.should_close = session is None
    
    def __enter__(self):
        """Begin transaction and return session."""
        return self.session
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Commit transaction if no exception, otherwise rollback."""
        try:
            if exc_type is not None:
                self.session.rollback()
            else:
                self.session.commit()
        finally:
            if self.should_close:
                self.session.close()
```

The standalone example implementation is available at: `/requirements/refactor/examples/transaction_context_example.py`

### 2. Repository Factory Improvements

Enhance the repository factory to support dependency injection and testing:

```python
def get_repository(model_class, session=None):
    """
    Get repository for model class with optional session.
    
    Args:
        model_class: SQLAlchemy model class
        session: Optional SQLAlchemy session
        
    Returns:
        Repository instance for model class
    """
    if model_class is UserSession:
        return UserSessionRepository(session)
    # Add more model types as needed
    else:
        return BaseRepository(model_class, session)
```

### 3. Unit of Work Pattern

Implement a Unit of Work pattern to coordinate transactions across multiple repositories:

```python
class UnitOfWork:
    """
    Coordinates work across multiple repositories.
    
    The Unit of Work pattern ensures that all operations within a transaction
    are either committed together or rolled back together.
    """
    
    def __init__(self):
        self.session = None
        self._repositories = {}
    
    def __enter__(self):
        self.session = get_db_session()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if exc_type is not None:
                self.session.rollback()
            else:
                self.session.commit()
        finally:
            self.session.close()
    
    def get_repository(self, model_class):
        """Get repository for model class using the current session."""
        if model_class not in self._repositories:
            self._repositories[model_class] = get_repository(model_class, self.session)
        return self._repositories[model_class]
```

### 4. Enhanced Type Safety

Improve type hints and generics usage for better IDE support and code safety:

```python
class BaseRepository(Generic[T]):
    """Generic repository for database operations."""
    
    def __init__(self, model_class: Type[T], session: Optional[Session] = None):
        """Initialize with model class and optional session."""
        self.model_class = model_class
        self._session = session
    
    @property
    def session(self) -> Session:
        """Get the current session or create a new one."""
        if self._session is not None:
            return self._session
        return get_db_session()
```

## Implementation Plan

1. Create the TransactionContext class in backend/app/database/transaction.py
2. Update BaseRepository to use the TransactionContext
3. Enhance factory.py with improved repository creation
4. Implement UnitOfWork pattern (optional, if needed)
5. Update services to use the improved repository pattern

## Testing

Add tests to verify:

1. Transaction atomicity
2. Proper rollback on exceptions
3. Session management
4. Repository factory functionality

## Timeline

1. ✅ Implement transaction context: June 27, 2025
2. Update BaseRepository: June 28, 2025
3. Enhance factory: June 29, 2025
4. Update services: June 29, 2025
5. Add integration tests: June 30, 2025
