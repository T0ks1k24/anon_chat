from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        try:
            print(f"Incoming WS connection: {scope.get('query_string')}")
            query = parse_qs(scope.get("query_string", b"").decode())
            token = query.get("token")

            if token:
                try:
                    access_token = AccessToken(token[0])
                    user = await User.objects.aget(id=access_token["user_id"])
                    scope["user"] = user
                    print(f"WS auth success for user: {user.username}")
                except Exception as e:
                    print(f"WS auth exception: {e}")
                    scope["user"] = AnonymousUser()
            else:
                print("No token provided in WS query.")
                scope["user"] = AnonymousUser()

            return await self.inner(scope, receive, send)
        except Exception as e:
            print(f"Fatal WS Middleware Error: {e}")
            import traceback
            traceback.print_exc()
            raise e
