"""Generic base repository."""

from typing import Generic, Optional, Type, TypeVar

from sqlalchemy.orm import Session

T = TypeVar("T")


class BaseRepository(Generic[T]):
    def __init__(self, db: Session, model: Type[T]) -> None:
        self._db = db
        self._model = model

    def get_by_id(self, id: int) -> Optional[T]:
        return self._db.query(self._model).filter(self._model.id == id).first()

    def add(self, entity: T) -> T:
        self._db.add(entity)
        return entity

    def delete(self, entity: T) -> None:
        self._db.delete(entity)

    def commit(self) -> None:
        self._db.commit()

    def refresh(self, entity: T) -> None:
        self._db.refresh(entity)
