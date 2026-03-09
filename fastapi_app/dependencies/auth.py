from typing import Optional,TYPE_CHECKING
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from fastapi_app.core.security import decode_access_token
from asgiref.sync import sync_to_async
from jose import jwt
from fastapi_app.core.security import decode_access_token

if TYPE_CHECKING:
    from django_backend.models import User as DjangoUser

User = get_user_model()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")
    token_version = payload.get("token_version")   

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload["sub"]
    token_iat = payload.get("iat")

    User = get_user_model()

    try:
        user = await sync_to_async(
            User.objects.select_related('profile').get
        )(email=email)

    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

  
    if token_version is not None:
        if hasattr(user, "profile") and token_version != user.profile.token_version:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalidated. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if hasattr(user, "profile"):
        if not user.profile.is_online:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is offline. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )


    if hasattr(user, 'profile') and user.profile.tokens_valid_after:

        valid_after_timestamp = user.profile.tokens_valid_after.timestamp()

        if token_iat is not None and token_iat < (valid_after_timestamp - 1):

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return user