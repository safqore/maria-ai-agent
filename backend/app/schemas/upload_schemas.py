"""
Upload schemas for request validation.
"""

from marshmallow import Schema, fields


class UploadSchema(Schema):
    """Schema for validating file upload requests."""

    session_uuid = fields.String(required=True)
