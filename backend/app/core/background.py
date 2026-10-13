"""Bounded background task processing worker for asynchronous AI analysis."""
import asyncio
import logging
import uuid
from typing import Optional
from app.core.database import AsyncSessionLocal
from app.services.ai_service import analyze_feedback

logger = logging.getLogger("feedbackpilot.background")

MAX_QUEUE_SIZE = 1000
_task_queue: asyncio.Queue[uuid.UUID] = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
_worker_task: Optional[asyncio.Task] = None
_is_running = False


async def enqueue_ai_analysis(feedback_id: uuid.UUID) -> bool:
    """Add a feedback ID to the background AI analysis queue."""
    try:
        _task_queue.put_nowait(feedback_id)
        logger.info(f"Enqueued AI analysis for feedback {feedback_id} (Queue size: {_task_queue.qsize()})")
        return True
    except asyncio.QueueFull:
        logger.error(f"AI task queue is full! Dropping background task for {feedback_id}.")
        return False


async def _worker_loop():
    """Worker loop that continuously pulls tasks from the queue and executes AI analysis."""
    global _is_running
    logger.info("AI background processing worker started.")
    while _is_running:
        try:
            feedback_id = await _task_queue.get()
            logger.info(f"Processing background AI analysis for feedback: {feedback_id}")

            async with AsyncSessionLocal() as session:
                try:
                    await analyze_feedback(session, feedback_id)
                    logger.info(f"Successfully finished AI analysis for feedback: {feedback_id}")
                except Exception as exc:
                    logger.error(f"Error during background AI analysis for {feedback_id}: {exc}")
                finally:
                    _task_queue.task_done()
        except asyncio.CancelledError:
            logger.info("Background worker loop cancelled.")
            break
        except Exception as exc:
            logger.error(f"Unexpected error in background worker loop: {exc}")
            await asyncio.sleep(1)


def start_background_worker():
    """Start the background worker task."""
    global _worker_task, _is_running
    if not _is_running:
        _is_running = True
        _worker_task = asyncio.create_task(_worker_loop())


async def stop_background_worker():
    """Gracefully stop the background worker task."""
    global _worker_task, _is_running
    _is_running = False
    if _worker_task:
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass
        _worker_task = None
    logger.info("Background worker stopped.")
