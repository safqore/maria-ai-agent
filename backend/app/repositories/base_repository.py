"""
Base repository module providing common database operations.

This module implements the repository pattern for SQLAlchemy models,
providing a set of standard operations that can be inherited by
model-specific repositories.
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
import uuid

from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.database import Base, get_db_session
from backend.app.database.transaction import TransactionContext
from backend.app.errors import ServerError, ResourceNotFoundError as NotFoundError

# Define a TypeVar for SQLAlchemy models
T = TypeVar('T', bound=Base)


class BaseRepository(Generic[T]):
    """
    Generic base repository for SQLAlchemy models.
    
    This class provides common database operations for any SQLAlchemy model,
    implementing the repository pattern to isolate database access from the
    service layer.
    
    Attributes:
        model_class: The SQLAlchemy model class this repository manages
    """
    
    def __init__(self, model_class: Type[T]):
        """
        Initialize the repository with a model class.
        
        Args:
            model_class: The SQLAlchemy model class this repository will manage
        """
        self.model_class = model_class
    
    def get_all(self) -> List[T]:
        """
        Get all records of the model.
        
        Returns:
            List of model instances
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with TransactionContext() as session:
                return session.query(self.model_class).all()
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in get_all: {str(e)}")
    
    def get_by_id(self, id_value: Union[int, str, uuid.UUID]) -> Optional[T]:
        """
        Get a record by its primary key.
        
        Args:
            id_value: The primary key value
            
        Returns:
            Model instance if found, None otherwise
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with TransactionContext() as session:
                # Get the primary key column name
                primary_key = inspect(self.model_class).primary_key[0].name
                
                # Create a filter for the primary key
                filter_condition = getattr(self.model_class, primary_key) == id_value
                
                return session.query(self.model_class).filter(filter_condition).first()
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in get_by_id: {str(e)}")
    
    def create(self, **kwargs) -> T:
        """
        Create a new record.
        
        Args:
            **kwargs: Fields to set on the new instance
            
        Returns:
            The created model instance
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with TransactionContext() as session:
                instance = self.model_class(**kwargs)
                session.add(instance)
                # No need to explicitly commit - TransactionContext handles it
                session.flush()  # Ensure the instance gets its ID assigned
                session.refresh(instance)
                return instance
        except SQLAlchemyError as e:
            # No need to rollback - TransactionContext handles it
            raise ServerError(f"Database error in create: {str(e)}")
    
    def update(self, id_value: Union[int, str, uuid.UUID], data: Dict[str, Any]) -> Optional[T]:
        """
        Update a record by its primary key.
        
        Args:
            id_value: The primary key value
            data: Dictionary with fields to update
            
        Returns:
            The updated model instance if found, None otherwise
            
        Raises:
            ServerError: If a database error occurs
            NotFoundError: If the record is not found
        """
        try:
            with TransactionContext() as session:
                # Get the primary key column name
                primary_key = inspect(self.model_class).primary_key[0].name
                
                # Create a filter for the primary key
                filter_condition = getattr(self.model_class, primary_key) == id_value
                
                # Find the instance
                instance = session.query(self.model_class).filter(filter_condition).first()
                
                if not instance:
                    raise NotFoundError(f"{self.model_class.__name__} with id {id_value} not found")
                
                # Update fields
                for key, value in data.items():
                    if hasattr(instance, key):
                        setattr(instance, key, value)
                
                # No need to explicitly commit - TransactionContext handles it
                session.flush()
                session.refresh(instance)
                return instance
        except SQLAlchemyError as e:
            # No need to rollback - TransactionContext handles it
            raise ServerError(f"Database error in update: {str(e)}")
    
    def delete(self, id_value: Union[int, str, uuid.UUID]) -> bool:
        """
        Delete a record by its primary key.
        
        Args:
            id_value: The primary key value
            
        Returns:
            True if the record was deleted, False if not found
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                # Get the primary key column name
                primary_key = inspect(self.model_class).primary_key[0].name
                
                # Create a filter for the primary key
                filter_condition = getattr(self.model_class, primary_key) == id_value
                
                # Find the instance
                instance = session.query(self.model_class).filter(filter_condition).first()
                
                if not instance:
                    return False
                
                session.delete(instance)
                session.commit()
                return True
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in delete: {str(e)}")
    
    def exists(self, id_value: Union[int, str, uuid.UUID]) -> bool:
        """
        Check if a record with the given primary key exists.
        
        Args:
            id_value: The primary key value
            
        Returns:
            True if the record exists, False otherwise
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                # Get the primary key column name
                primary_key = inspect(self.model_class).primary_key[0].name
                
                # Create a filter for the primary key
                filter_condition = getattr(self.model_class, primary_key) == id_value
                
                # Check if the record exists
                return session.query(
                    session.query(self.model_class).filter(filter_condition).exists()
                ).scalar()
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in exists: {str(e)}")
    
    def count(self) -> int:
        """
        Count the number of records.
        
        Returns:
            The number of records
            
        Raises:
            ServerError: If a database error occurs
        """
        try:
            with get_db_session() as session:
                return session.query(self.model_class).count()
        except SQLAlchemyError as e:
            raise ServerError(f"Database error in count: {str(e)}")
