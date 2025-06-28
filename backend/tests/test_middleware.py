"""
Tests for the middleware module.
"""

import pytest
from unittest.mock import patch, MagicMock
from flask import Flask, request, g
from backend.app.utils.middleware import log_request_middleware, setup_request_logging


class TestMiddleware:
    @pytest.fixture
    def app(self):
        """Create a Flask test application."""
        app = Flask(__name__)
        
        @app.route('/test')
        def test_route():
            return {'message': 'test'}
            
        return app

    def test_log_request_middleware_before_request(self, app):
        """Test that before_request middleware sets request timing and ID."""
        before_request, _ = log_request_middleware()
        
        with app.test_request_context('/test'):
            before_request()
            assert hasattr(g, 'request_start_time')
            assert hasattr(g, 'correlation_id')
            assert isinstance(g.correlation_id, str)
            
    def test_log_request_middleware_after_request(self, app):
        """Test that after_request middleware logs and adds headers."""
        before_request, after_request = log_request_middleware()
        
        with app.test_request_context('/test'):
            before_request()
            response = app.make_response(('test', 200))
            processed_response = after_request(response)
            
            # Check that correlation ID was added to headers
            assert 'X-Correlation-ID' in processed_response.headers
            assert processed_response.headers['X-Correlation-ID'] == g.correlation_id
            
    @patch('backend.app.utils.middleware.logger')
    def test_middleware_logs_requests(self, mock_logger, app):
        """Test that the middleware logs request information."""
        with app.test_request_context('/test', method='GET'):
            before_request, after_request = log_request_middleware()
            before_request()
            response = app.make_response(('test', 200))
            after_request(response)
            
            # Assert that logger was called for both before and after request
            assert mock_logger.info.call_count == 2
            
    def test_setup_request_logging(self, app):
        """Test that setup_request_logging adds middleware to app."""
        # Check app before_request and after_request functions before
        before_count = len(app.before_request_funcs.get(None, []))
        after_count = len(app.after_request_funcs.get(None, []))
        
        # Set up request logging
        setup_request_logging(app)
        
        # Verify that new functions were added
        assert len(app.before_request_funcs.get(None, [])) == before_count + 1
        assert len(app.after_request_funcs.get(None, [])) == after_count + 1
