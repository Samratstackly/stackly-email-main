from django.core.mail import EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def smtp_send(email_obj):
    """
    Sends an email using Django's EmailMessage class.
    """
    try:
        email = EmailMessage(
            subject=email_obj.subject,
            body=email_obj.body,
            from_email=settings.EMAIL_HOST_USER,
            to=[email_obj.receiver.email],
        )

        if hasattr(email_obj, 'attachments'):
            for attachment in email_obj.attachments.all():
                try:
                    
                    if attachment.file:
                        email.attach_file(attachment.file.path)
                except Exception as e:
                    logger.error(f"Could not attach file {attachment.id}: {e}")

        email.send(fail_silently=False)
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {email_obj.receiver.email}: {str(e)}")
        raise e