"""
Database connection module for the Maria AI Agent backend.

This module provides:
1. Direct psycopg2 connections to PostgreSQL (legacy)
2. SQLAlchemy ORM integration (preferred)

Note: The direct connection function is kept for backward compatibility during
the transition to SQLAlchemy ORM.
"""

import os

import psycopg2
from app.database_core import get_db_session, get_engine


def get_db_connection():
    """
    Create and return a direct connection to the PostgreSQL database.

    DEPRECATED: Use SQLAlchemy ORM through app.database.get_db_session() instead.

    The connection parameters are read from environment variables:
    - POSTGRES_DB: Database name
    - POSTGRES_USER: Database user
    - POSTGRES_PASSWORD: Database password
    - POSTGRES_HOST: Database host (defaults to 'localhost')
    - POSTGRES_PORT: Database port (defaults to 5432)

    Returns:
        psycopg2.connection: A connection to the PostgreSQL database

    Raises:
        psycopg2.OperationalError: If the connection cannot be established
    """
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", 5432),
    )
