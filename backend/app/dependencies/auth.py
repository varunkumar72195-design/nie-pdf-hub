
import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.admin import Admin

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/admin/token"
)


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )

        admin_id = payload.get("sub")

        if admin_id is None:
            raise credentials_exception

        admin_id = int(admin_id)

    except (InvalidTokenError, ValueError):
        raise credentials_exception

    admin = db.query(Admin).filter(
        Admin.id == admin_id
    ).first()

    if admin is None or not admin.is_active:
        raise credentials_exception

    return admin
