
from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    print("\nACADEMIC YEARS:")

    result = conn.execute(text("""
        SELECT id, department_id, year_number, name
        FROM academic_years
        ORDER BY department_id, year_number
    """))

    for row in result:
        print(tuple(row))

    print("\nUNIQUE CONSTRAINTS:")

    result = conn.execute(text("""
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'academic_years'::regclass
        AND contype = 'u'
    """))

    for row in result:
        print(row[0])
