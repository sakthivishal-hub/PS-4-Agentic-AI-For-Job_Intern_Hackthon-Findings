from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(
    # bcrypt_sha256 pre-hashes the password with SHA-256 before bcrypt,
    # which removes bcrypt's hard 72-byte password limit (the crash some
    # users hit as "password cannot be longer than 72 bytes"). Plain
    # "bcrypt" is kept only so any previously-created hashes still verify.
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    try:
        return pwd_context.verify(
            plain_password,
            hashed_password,
        )
    except ValueError:
        # Defensive fallback: never 500 the login route because of a
        # malformed/legacy hash or an over-length raw password.
        return False


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    to_encode = data.copy()

    expire = (
        datetime.now(UTC)
        + (
            expires_delta
            or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str):
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
    except JWTError:
        return None