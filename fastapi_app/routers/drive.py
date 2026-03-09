from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Depends
from asgiref.sync import sync_to_async
from django_backend.models import DriveFile
from fastapi_app.schemas.drive_schemas import DriveFileRead
from fastapi_app.routers.auth import get_current_user, get_user_model
from django.core.files.base import ContentFile
from typing import List
from fastapi import UploadFile, File
from pydantic import BaseModel
from typing import List
from fastapi_app.schemas.drive_schemas import DeleteFilesSchema
import os

router = APIRouter()



@router.post("/upload")
async def upload_files(
          files: List[UploadFile] = File(...),
          current_user=Depends(get_current_user) 
):

    saved_files = []

    try:
        # Ensure media folder exists
        os.makedirs("media", exist_ok=True)

        for file in files:
            contents = await file.read()

            file_path = os.path.join("media", file.filename)

            with open(file_path, "wb") as f:
                f.write(contents)
              
            await sync_to_async(DriveFile.objects.create)(
                owner=current_user,
                original_name=file.filename,
                size=len(contents),
                content_type=file.content_type,
                file=file_path, 
                is_favorite=False,
                is_trashed=False
            )  

            saved_files.append(file.filename)

        return {
            "message": "Files uploaded successfully",
            "files": saved_files
        }

    except Exception as e:
        print("UPLOAD ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="File upload failed"
        )
    
@router.get("/my-files", response_model=list[DriveFileRead])
async def my_files(current_user=Depends(get_current_user)):
    files = await sync_to_async(list)(
        DriveFile.objects.filter(owner=current_user,is_trashed=False).order_by("-created_at")
    )

    return [
        {
            "id": file.id,
            "original_name": file.original_name,
            "size": file.size,
            "content_type": file.content_type,
            "created_at": file.created_at,
            "url": f"/media/{file.original_name}",
            "is_image": file.content_type.startswith("image"),  
            "is_favorite": file.is_favorite,
        }
        for file in files
    ]


@router.patch("/{file_id}/favorite")
async def toggle_favorite(file_id: int, current_user=Depends(get_current_user)):

    try:
        file = await sync_to_async(
            DriveFile.objects.get
        )(id=file_id, owner=current_user)

        file.is_favorite = not file.is_favorite
        await sync_to_async(file.save)()

        return {
            "message": "Favorite updated",
            "is_favorite": file.is_favorite
        }

    except DriveFile.DoesNotExist:
        raise HTTPException(status_code=404, detail="File not found")
    
@router.get("/favorites")
async def get_favorite_files(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(
        DriveFile.objects.filter(owner=current_user, is_favorite=True,is_trashed=False)
        
    )

    return [
        {
            "id": file.id,
            "original_name": file.original_name,
            "url": f"/media/{file.original_name}",
            "is_favorite": file.is_favorite
        }
        for file in files
    ]

@router.post("/{file_id}/share")
async def share_file(
    file_id: int,
    email: str,
    current_user=Depends(get_current_user)
):
    try:
        file = await sync_to_async(DriveFile.objects.get)(
            id=file_id,
            owner=current_user,
            is_trashed=False
        )

        User = get_user_model()
        user_to_share = await sync_to_async(User.objects.get)(email=email)

        await sync_to_async(file.shared_with.add)(user_to_share)

        return {"message": f"File shared with {email}"}

    except DriveFile.DoesNotExist:
        raise HTTPException(status_code=404, detail="File not found")

    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")
    
@router.get("/shared-with-me")
async def shared_with_me(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(
        DriveFile.objects.filter(
            shared_with=current_user,
            is_trashed=False
        ).order_by("-created_at")
    )
    return [
        {
            "id": file.id,
            "original_name": file.original_name,
            "owner": await sync_to_async(lambda: file.owner.email)(),
            "url": f"/media/{file.original_name}",
        }
        for file in files
    ] 

@router.get("drive/shared-by-me")
async def shared_by_me(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(
        DriveFile.objects.filter(
            owner=current_user,
            shared_with__isnull=False,
            is_trashed=False
        ).distinct().order_by("-created_at")
    )

    return [
        {
            "id": file.id,
            "original_name": file.original_name,
            "shared_count": await sync_to_async(file.shared_with.count)(),
            "url": f"/media/{file.original_name}",
        }
        for file in files
    ]   
        
@router.delete("/{file_id}")
async def move_to_trash(file_id: int, current_user=Depends(get_current_user)):

    try:
        file = await sync_to_async(
            DriveFile.objects.get
        )(id=file_id, owner=current_user)

        file.is_trashed = True
        await sync_to_async(file.save)()

        return {"message": "File moved to trash"}

    except DriveFile.DoesNotExist:
        raise HTTPException(status_code=404, detail="File not found")
    
@router.get("/trash")
async def get_trash(current_user=Depends(get_current_user)):

    files = await sync_to_async(list)(
        DriveFile.objects.filter(
            owner=current_user,
            is_trashed=True
        ).order_by("-created_at")
    )

    return [
        {
            "id": file.id,
            "original_name": file.original_name,
            "url": f"/media/{file.original_name}",
            "is_favorite": file.is_favorite,
        }
        for file in files
    ]

@router.delete("/drive/trash/empty")
async def empty_trash(user=Depends(get_current_user)):

    await sync_to_async(
    DriveFile.objects.filter(owner=user, is_trashed=True).delete
)()

    return {"message": "Trash emptied successfully"}

@router.delete("/drive/trash/delete-selected")
async def delete_selected_files(
    data: DeleteFilesSchema,
    user=Depends(get_current_user)
):

    await sync_to_async(
    DriveFile.objects.filter(
        owner=user,
        id__in=data.file_ids,
        is_trashed=True
    ).delete
)()

    return {"message": "Selected files deleted permanently"}

@router.patch("/{file_id}/restore")
async def restore_file(file_id: int, current_user=Depends(get_current_user)):

    try:
        file = await sync_to_async(
            DriveFile.objects.get
        )(id=file_id, owner=current_user, is_trashed=True)

        file.is_trashed = False
        await sync_to_async(file.save)()

        return {"message": "File restored successfully"}

    except DriveFile.DoesNotExist:
        raise HTTPException(status_code=404, detail="File not found in trash")
    
