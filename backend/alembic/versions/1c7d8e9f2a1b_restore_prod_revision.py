"""restore_prod_revision

Revision ID: 1c7d8e9f2a1b
Revises: 4c8fa44f1090
Create Date: 2026-06-04 22:00:00.000000

No-op bridge for production DBs already stamped at this revision
(a migration file that was applied in deploy but never committed).
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "1c7d8e9f2a1b"
down_revision: Union[str, None] = "4c8fa44f1090"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
