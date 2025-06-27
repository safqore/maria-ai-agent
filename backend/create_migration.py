"""
Create an initial migration script for SQLAlchemy models.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to the Python path to allow importing from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from alembic import command
from alembic.config import Config
from app.database import engine
from app.models import Base


def create_migration():
    """Create an initial migration script."""
    # Create migrations directory if it doesn't exist
    migrations_dir = Path(__file__).parent / "migrations_alembic" / "versions"
    migrations_dir.mkdir(parents=True, exist_ok=True)
    
    # Create alembic.ini
    alembic_ini = Path(__file__).parent / "alembic.ini"
    if not alembic_ini.exists():
        with open(alembic_ini, "w") as f:
            f.write("""
[alembic]
script_location = migrations_alembic
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
            """.strip())
    
    # Initialize configuration
    alembic_cfg = Config(str(alembic_ini))
    
    # Create the migration script
    command.revision(alembic_cfg, 
                    message="initial_schema", 
                    autogenerate=True)


if __name__ == "__main__":
    # Create tables in database
    Base.metadata.create_all(engine)
    
    # Create migration script
    create_migration()
    
    print("Initial migration created successfully.")
