
"""add regulations and link academic years

Revision ID: 586b5d83f361
Revises: 08b6c3cec2d3
"""

from alembic import op
import sqlalchemy as sa


revision = "586b5d83f361"
down_revision = "08b6c3cec2d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create regulations table
    op.create_table(
        "regulations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "department_id",
            sa.Integer(),
            sa.ForeignKey("departments.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "department_id",
            "code",
            name="uq_department_regulation",
        ),
    )

    # 2. Insert R23 for every existing department
    op.execute(
        """
        INSERT INTO regulations (department_id, name, code, description)
        SELECT id, 'R23 Regulation', 'R23',
               'R23 academic regulation'
        FROM departments
        """
    )

    # 3. Add nullable regulation_id first
    op.add_column(
        "academic_years",
        sa.Column("regulation_id", sa.Integer(), nullable=True),
    )

    # 4. Assign existing academic years to their department's R23
    op.execute(
        """
        UPDATE academic_years AS ay
        SET regulation_id = r.id
        FROM regulations AS r
        WHERE r.department_id = ay.department_id
          AND r.code = 'R23'
        """
    )

    # 5. Ensure every academic year received a regulation
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM academic_years
                WHERE regulation_id IS NULL
            ) THEN
                RAISE EXCEPTION
                    'Some academic years could not be assigned to R23';
            END IF;
        END $$;
        """
    )

    # 6. Make regulation_id mandatory
    op.alter_column(
        "academic_years",
        "regulation_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    # 7. Add foreign key
    op.create_foreign_key(
        "fk_academic_years_regulation_id",
        "academic_years",
        "regulations",
        ["regulation_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 8. Replace old unique constraint
    op.drop_constraint(
        "uq_department_year",
        "academic_years",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_department_regulation_year",
        "academic_years",
        ["department_id", "regulation_id", "year_number"],
    )


def downgrade() -> None:
    # Restore original unique constraint
    op.drop_constraint(
        "uq_department_regulation_year",
        "academic_years",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_department_year",
        "academic_years",
        ["department_id", "year_number"],
    )

    # Remove regulation foreign key and column
    op.drop_constraint(
        "fk_academic_years_regulation_id",
        "academic_years",
        type_="foreignkey",
    )

    op.drop_column("academic_years", "regulation_id")

    # Remove regulations table
    op.drop_table("regulations")
