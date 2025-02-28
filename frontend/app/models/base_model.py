# In this example we are not using any database, so we have a empty base class

class BaseModel:
    """Base class for models."""
    def __init__(self):
        pass
    
# example of a future data class
# class User(BaseModel):
#     def __init__(self, name, email):
#         super().__init__()
#         self.name = name
#         self.email = email

#     def get_full_info(self):
#        return f"User name: {self.name} , email: {self.email}"
