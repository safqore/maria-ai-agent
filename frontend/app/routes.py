from app.controllers import main_controller
from flask import request

def register_routes(app):
    app.add_url_rule("/", "index", main_controller.index)
    app.add_url_rule(
        "/upload",
        "upload",
        lambda: main_controller.handle_file_upload(request),
        methods=["POST"]
    )