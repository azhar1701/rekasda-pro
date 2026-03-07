import uuid
import asyncio
from typing import Dict, Any, Optional, Callable
from pydantic import BaseModel
from datetime import datetime
from loguru import logger

class TaskStatus(BaseModel):
    task_id: str
    status: str  # pending, running, completed, failed
    progress: float = 0.0
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TaskManager:
    def __init__(self):
        self.tasks: Dict[str, TaskStatus] = {}

    async def create_task(self, func: Callable, *args, **kwargs) -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = TaskStatus(
            task_id=task_id,
            status="pending",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Start background execution
        asyncio.create_task(self._run_task(task_id, func, *args, **kwargs))
        return task_id

    async def _run_task(self, task_id: str, func: Callable, *args, **kwargs):
        self.tasks[task_id].status = "running"
        self.tasks[task_id].updated_at = datetime.now()
        
        try:
            logger.info(f"Starting background task {task_id}")
            # Identify if it's a sync or async function
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                # Run sync functions in a threadpool to avoid blocking event loop
                result = await asyncio.to_thread(func, *args, **kwargs)
            
            self.tasks[task_id].status = "completed"
            self.tasks[task_id].result = result
            self.tasks[task_id].progress = 100.0
            logger.info(f"Task {task_id} completed successfully")
        except Exception as e:
            logger.exception(f"Task {task_id} failed: {str(e)}")
            self.tasks[task_id].status = "failed"
            self.tasks[task_id].error = str(e)
        finally:
            self.tasks[task_id].updated_at = datetime.now()

    def get_status(self, task_id: str) -> Optional[TaskStatus]:
        return self.tasks.get(task_id)

# Global instances
task_manager = TaskManager()
