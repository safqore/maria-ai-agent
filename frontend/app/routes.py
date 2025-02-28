from app.controllers import main_controller

def register_routes(app):
    app.add_url_rule("/", "index", main_controller.index)
