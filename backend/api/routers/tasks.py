from fastapi import APIRouter, HTTPException
from api.utils.tasks import task_manager, TaskStatus

router = APIRouter()

@router.get("/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    status = task_manager.get_status(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="Task not found")
    return status
