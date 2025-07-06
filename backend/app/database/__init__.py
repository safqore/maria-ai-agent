"""
Database package for Maria AI Agent.

This package provides database configuration, connection management,
and transaction handling.
"""

# Only expose TransactionContext from transaction.py
from app.database.transaction import TransactionContext

__all__ = [
    "TransactionContext",
]
