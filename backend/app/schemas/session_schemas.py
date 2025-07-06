"""
Session schemas for request validation.
"""

from marshmallow import Schema, ValidationError, fields, validates


class UUIDSchema(Schema):
    """Schema for validating UUID requests."""

    uuid = fields.String(required=True)

    @validates("uuid")
    def validate_uuid(self, value, **kwargs):
        """Validate that the UUID is in the correct format."""
        from uuid import UUID

        try:
            UUID(value)
        except ValueError:
            raise ValidationError("Invalid UUID format")


class SessionPersistSchema(Schema):
    """Schema for validating session persistence requests."""

    session_uuid = fields.String(required=True)
    name = fields.String(required=False, load_default="", allow_none=True)
    email = fields.String(required=False, load_default="", allow_none=True)

    @validates("session_uuid")
    def validate_session_uuid(self, value, **kwargs):
        """Validate that the session UUID is in the correct format."""
        from uuid import UUID

        try:
            UUID(value)
        except ValueError:
            raise ValidationError("Invalid UUID format")
