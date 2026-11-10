from app.database import SessionLocal
from app.models.admin import Admin
from app.services.auth import hash_password


ADMIN_NAME = "NIE Admin"
ADMIN_EMAIL = "admin@nie.edu"
ADMIN_PASSWORD = "NIE@Admin123"


def create_admin():
    db = SessionLocal()

    try:
        existing_admin = (
            db.query(Admin)
            .filter(Admin.email == ADMIN_EMAIL)
            .first()
        )

        if existing_admin:
            print("Admin account already exists!")
            print(f"Email: {ADMIN_EMAIL}")
            print("No changes were made.")
            return

        new_admin = Admin(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            is_active=True
        )

        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

        print("Admin account created successfully!")
        print(f"Admin ID: {new_admin.id}")
        print(f"Email: {ADMIN_EMAIL}")
        print(f"Password: {ADMIN_PASSWORD}")

    except Exception as error:
        db.rollback()
        print("Failed to create admin:", error)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()