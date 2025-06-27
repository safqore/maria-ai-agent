"""
Example implementation of TransactionContext for Maria AI Agent refactoring.

This standalone file demonstrates how to implement a TransactionContext
that can be used with SQLAlchemy ORM to handle database transactions.

Implementation notes:
1. This file does not import from any other project files to avoid circular imports
2. The TransactionContext can be used with or without an existing session
3. The TransactionContext ensures proper commit/rollback semantics
"""

from typing import Optional
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session


# Example database URL (for demonstration purposes only)
DATABASE_URL = "sqlite:///:memory:"

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL, echo=False)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


@contextmanager
def get_db_session() -> Session:
    """
    Context manager for database sessions.
    
    This function provides a database session that is automatically
    closed after use, and handles committing changes or rolling back
    on exceptions.
    
    Example:
        with get_db_session() as session:
            user = session.query(User).filter(User.id == 1).first()
            
    Returns:
        SQLAlchemy session object
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


class TransactionContext:
    """
    Context manager for database transactions.
    
    This class ensures that database operations within a context are atomic,
    with proper commit and rollback handling.
    
    Examples:
        # Using with an existing session
        session = SessionLocal()
        with TransactionContext(session) as tx_session:
            # Do operations with tx_session
            # Commits or rollbacks based on exceptions
        
        # Creating a new session automatically
        with TransactionContext() as session:
            # Do operations with session
            # Session is closed after the context
    """
    
    def __init__(self, session: Optional[Session] = None):
        """
        Initialize with optional session.
        
        Args:
            session: SQLAlchemy session to use. If None, a new session is created.
        """
        self.session = session or SessionLocal()
        self.should_close = session is None
    
    def __enter__(self) -> Session:
        """
        Begin transaction and return session.
        
        Returns:
            SQLAlchemy session for database operations
        """
        return self.session
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Commit transaction if no exception, otherwise rollback.
        
        Args:
            exc_type: Exception type if an exception occurred, None otherwise
            exc_val: Exception value if an exception occurred, None otherwise
            exc_tb: Exception traceback if an exception occurred, None otherwise
        """
        try:
            if exc_type is not None:
                self.session.rollback()
            else:
                self.session.commit()
        finally:
            if self.should_close:
                self.session.close()


# Example usage
def example_transaction_context():
    """Example of how to use TransactionContext."""
    # Example model
    class User(Base):
        __tablename__ = "users"
        
        from sqlalchemy import Column, Integer, String
        
        id = Column(Integer, primary_key=True, index=True)
        name = Column(String, nullable=False)
        email = Column(String, unique=True, nullable=False)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Example 1: Using TransactionContext with a new session
    print("Example 1: Using TransactionContext with a new session")
    try:
        with TransactionContext() as session:
            new_user = User(name="Test User", email="test@example.com")
            session.add(new_user)
            print("  - User added, will be committed")
            
        # The session is now committed and closed
        
        # Verify the user was added
        with get_db_session() as verify_session:
            user = verify_session.query(User).filter(User.email == "test@example.com").first()
            print(f"  - User verified: {user.name}, {user.email}")
    except Exception as e:
        print(f"  - Error: {e}")
    
    # Example 2: Using TransactionContext with an existing session
    print("\nExample 2: Using TransactionContext with an existing session")
    try:
        session = SessionLocal()
        
        # First operation outside the transaction context
        user_count = session.query(User).count()
        print(f"  - User count before: {user_count}")
        
        # Now use the transaction context with the same session
        with TransactionContext(session) as tx_session:
            new_user = User(name="Another User", email="another@example.com")
            tx_session.add(new_user)
            print("  - Another user added, will be committed")
        
        # The session is still open but changes are committed
        user_count = session.query(User).count()
        print(f"  - User count after: {user_count}")
        
        # Remember to close the session when done
        session.close()
    except Exception as e:
        print(f"  - Error: {e}")
    
    # Example 3: Handling exceptions with rollback
    print("\nExample 3: Handling exceptions with rollback")
    try:
        with TransactionContext() as session:
            user_count_before = session.query(User).count()
            print(f"  - User count before exception: {user_count_before}")
            
            # This will fail because the email is not unique
            new_user = User(name="Duplicate User", email="test@example.com")
            session.add(new_user)
            
            # This line will not be reached
            print("  - This line should not be printed")
    except Exception as e:
        print(f"  - Expected error: {e}")
    
    # Verify the user count didn't change due to rollback
    with get_db_session() as verify_session:
        user_count_after = verify_session.query(User).count()
        print(f"  - User count after exception: {user_count_after}")
        print(f"  - Transaction was rolled back: {user_count_before == user_count_after}")


if __name__ == "__main__":
    example_transaction_context()
