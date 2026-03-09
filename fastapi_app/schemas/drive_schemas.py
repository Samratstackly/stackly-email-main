from pydantic import BaseModel
from datetime import datetime
from typing import List

class DriveFileRead(BaseModel):
    id: int
    original_name: str
    size: int
    content_type: str
    created_at: datetime
    url: str
    is_image: bool
    is_favorite: bool

    class Config:
        from_attributes = True

class DeleteFilesSchema(BaseModel):
    file_ids: List[int]

