"""Custom SQLAlchemy column types."""

import json
from typing import Any, List, Optional

from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator


class JsonListType(TypeDecorator):
    """Stores a List[str] as a JSON-encoded Text column.

    Centralizes encode/decode logic that was previously duplicated in
    UserProfile.to_dict() and routes_profile.py.
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Any) -> Optional[str]:
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value: Any, dialect: Any) -> List[str]:
        if not value:
            return []
        try:
            result = json.loads(value)
            return result if isinstance(result, list) else []
        except (json.JSONDecodeError, TypeError):
            return []
