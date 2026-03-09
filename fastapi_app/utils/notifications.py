from django_backend.models import Notification

def create_notification(user, title, message):
    Notification.objects.create(
        user=user,
        title=title,
        message=message
    )
