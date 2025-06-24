"""
Database connection module for the Maria AI Agent backend.

This module provides functions to establish connections to the PostgreSQL database.
"""

import os

import psycopg2


def get_db_connection():
    """
    Create and return a connection to the PostgreSQL database.

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
