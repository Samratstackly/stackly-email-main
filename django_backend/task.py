from celery import shared_task
from django.core.mail import EmailMessage


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=10,
    retry_kwargs={"max_retries": 3},
)
def send_auto_reply_task(self, recipient_email: str, subject: str, body: str):
    email = EmailMessage(
        subject=subject,
        body=body,
        to=[recipient_email],
    )

    # 🔒 RFC 3834 REQUIRED HEADER
    email.extra_headers = {
        "Auto-Submitted": "auto-replied"
    }

    email.send(fail_silently=False)