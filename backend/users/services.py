from django.contrib.auth import  authenticate

def login_user(username, password):
    user = authenticate(username=username, password=password)
    if not user:
        raise Exception("Invalid credentials")
    return user
