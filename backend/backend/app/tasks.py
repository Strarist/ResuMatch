import time
from celery.utils.log import get_task_logger
from .celery_worker import celery_app
import sentry_sdk
from prometheus_client import Histogram

logger = get_task_logger(__name__)

pdf_processing_histogram = Histogram(
    'resume_pdf_processing_seconds',
    'Time spent processing resume PDFs',
    ['status']
)

@celery_app.task(bind=True, name="process_pdf")
def process_pdf(self, resume_id: int, file_path: str):
    logger.info(f"[Task] Start processing resume {resume_id} at {file_path}")
    start = time.time()
    try:
        # Simulate PDF processing
        time.sleep(2)
        # Here: extract text, parse skills, store in DB, etc.
        logger.info(f"[Task] Finished processing resume {resume_id}")
        pdf_processing_histogram.labels(status="success").observe(time.time() - start)
        return {"status": "success", "resume_id": resume_id}
    except Exception as e:
        logger.error(f"[Task] Error processing resume {resume_id}: {e}")
        sentry_sdk.capture_exception(e)
        pdf_processing_histogram.labels(status="error").observe(time.time() - start)
        raise self.retry(exc=e, countdown=10, max_retries=3) 