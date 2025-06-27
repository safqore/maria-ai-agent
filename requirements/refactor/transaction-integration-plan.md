# Integration Plan: TransactionContext & BaseRepository

This document outlines the plan for integrating the TransactionContext with the BaseRepository class to enhance transaction management in the Maria AI Agent backend.

## Current Status

We have successfully implemented and tested the TransactionContext in a standalone example, but integrating it with the existing BaseRepository requires careful handling of import dependencies.

## Integration Strategy

To avoid circular imports while integrating TransactionContext with BaseRepository, we'll use the following strategy:

### Step 1: Create a Standalone Transaction Module

Create a standalone transaction module in the main database.py file that doesn't depend on other parts of the application:

```python
# In backend/app/database.py

# Add this to the existing file
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

### Step 2: Update BaseRepository Class

Update the BaseRepository class to use the TransactionContext:

```python
# In backend/app/repositories/base_repository.py

from backend.app.database import TransactionContext

class BaseRepository(Generic[T]):
    # Existing code...
    
    def create(self, **kwargs) -> T:
        """Create a new instance of the model."""
        instance = self.model_class(**kwargs)
        
        with TransactionContext(self._session) as session:
            session.add(instance)
            session.flush()  # Flush to get the ID
            
        return instance
```

### Step 3: Update Other Repository Methods

Update each repository method to use the TransactionContext:

```python
def get_by_id(self, id_value) -> Optional[T]:
    """Get an instance by ID."""
    with TransactionContext(self._session) as session:
        return session.query(self.model_class).filter(
            self.model_class.id == id_value
        ).first()

def update(self, id_value, data: Dict[str, Any]) -> Optional[T]:
    """Update an instance by ID."""
    with TransactionContext(self._session) as session:
        instance = session.query(self.model_class).filter(
            self.model_class.id == id_value
        ).first()
        
        if instance:
            for key, value in data.items():
                setattr(instance, key, value)
            
        return instance

def delete(self, id_value) -> bool:
    """Delete an instance by ID."""
    with TransactionContext(self._session) as session:
        instance = session.query(self.model_class).filter(
            self.model_class.id == id_value
        ).first()
        
        if instance:
            session.delete(instance)
            return True
            
        return False
```

### Step 4: Update UserSessionRepository Methods

Update UserSessionRepository to use TransactionContext for its specialized methods:

```python
def get_by_uuid(self, session_uuid: str) -> Optional[UserSession]:
    """Get a user session by UUID."""
    with TransactionContext(self._session) as session:
        return session.query(UserSession).filter(
            UserSession.uuid == session_uuid
        ).first()

def create_session(self, session_uuid: str, name: str, email: str) -> UserSession:
    """Create a new user session."""
    with TransactionContext(self._session) as session:
        user_session = UserSession(
            uuid=session_uuid,
            name=name,
            email=email
        )
        session.add(user_session)
        session.flush()
        
        return user_session
```

## Implementation Timeline

1. Add TransactionContext to database.py: June 28, 2025
2. Update BaseRepository methods: June 28, 2025
3. Update UserSessionRepository methods: June 28, 2025
4. Create tests for the integrated implementation: June 29, 2025

## Risk Mitigation

1. **Circular Import Risk**: By adding TransactionContext directly to database.py, we avoid circular imports
2. **Breaking Changes Risk**: Each method will be updated incrementally and tested
3. **Session Handling Risk**: The TransactionContext has been verified to work correctly in standalone tests

## Success Criteria

1. All repository methods use TransactionContext for transaction management
2. No circular import errors or other import-related issues
3. All tests pass with the updated implementation
4. Each repository operation correctly commits or rolls back transactions
