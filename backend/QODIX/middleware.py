import os
import django
from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.conf import settings
import jwt
from django.contrib.auth import get_user_model
import functools

User = get_user_model()

@functools.lru_cache(maxsize=100)
def _get_user_cached(token):
    try:
        decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return User.objects.get(id=decoded_data["user_id"])
    except Exception:
        return AnonymousUser()

@database_sync_to_async
def get_user_from_token(token):
    return _get_user_cached(token)

class JWTAuthMiddleware:
    """
    Custom middleware that extracts the JWT token from the query string
    and authenticates the user for WebSocket connections.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope['query_string'].decode())
        token = query_string.get('token')
        
        if token:
            scope['user'] = await get_user_from_token(token[0])
        else:
            scope['user'] = AnonymousUser()
            
        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
