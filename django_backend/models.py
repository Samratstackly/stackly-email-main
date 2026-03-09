from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager, AbstractUser
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError



class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)
    

class LanguageChoice(models.TextChoices):
    EN_US = "en-US", "English (US)"
    ES_ES = "es-ES", "Spanish (Spain)"
    FR_FR = "fr-FR", "French (France)"
    DE_DE = "de-DE", "German (Germany)"
    HI_IN = "hi-IN", "Hindi (India)"    

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('STAFF', 'Staff'),
    )

    GENDER_CHOICES = (
    ("MALE", "Male"),
    ("FEMALE", "Female"),
    ("OTHER", "Other"),
    )
 
    gender = models.CharField(
    max_length=10,
    choices=GENDER_CHOICES,
    blank=True,
    null=True
    )

    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('IN_MEETING', 'In Meeting'),
        ('DND', 'Do Not Disturb'),
        ('BRB', 'Be Right Back'),
        ('AWAY', 'Appear Away'),
        ('OFFLINE', 'Offline'),
    )
    
    THEME_CHOICES = (
        ('light', 'Light Mode'),
        ('dark', 'Dark Mode'),
        ('dim', 'Dim Mode'),
        ('system', 'System Default'),
    )

    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
   
    dob = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) 
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF') 
    mobile_number = models.CharField(max_length=15, blank=True, null=True)
    date_joined = models.DateTimeField(default=timezone.now)
    last_seen = models.DateTimeField(null=True, blank=True)

    language = models.CharField(
        max_length=10,
        choices=LanguageChoice.choices,
        default=LanguageChoice.EN_US,
        help_text="Preferred UI language",
    )
    
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OFFLINE')
    is_manually_set = models.BooleanField(default=False)
    status_expiry = models.DateTimeField(null=True, blank=True)
    status_message = models.CharField(max_length=255, blank=True, null=True)
    
    signature = models.TextField(blank=True, null=True, help_text="User's email signature")
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='system')
    last_active_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()
    
    vacation_mode_enabled = models.BooleanField(default=False)
    vacation_start_date = models.DateTimeField(null=True, blank=True)
    vacation_end_date = models.DateTimeField(null=True, blank=True)
    vacation_message = models.TextField(
         blank=True,
         default="I am currently out of the office and will reply upon my return."
     )

    def __str__(self):
        return self.email

class Email(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="sent_emails", on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="received_emails", on_delete=models.CASCADE, null=True, blank=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    parent = models.ForeignKey("self", null=True, blank=True, related_name="replies", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    is_deleted_by_sender = models.BooleanField(default=False)
    is_deleted_by_receiver = models.BooleanField(default=False)

    is_important = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    
    
    snoozed_until = models.DateTimeField(null=True, blank=True)
    snoozed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="snoozed_emails",
    )

    @property
    def is_snoozed(self):
        return self.snoozed_until is not None and self.snoozed_until > timezone.now()


    @property
    def from_email(self) -> str:
        return self.sender.email if self.sender else ""

    @property
    def snippet(self) -> str:
        return (self.body or "")[:100]

    
    
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent')
    )
    # Fixed Logic: Default should be DRAFT, not SENT
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='DRAFT')




    def __str__(self):
        receiver_email = self.receiver.email if self.receiver else "Draft"
        return f"{self.sender.email} -> {receiver_email}"

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("OUTBOX", "Outbox"),
        ("SCHEDULED", "Scheduled"),
        ("SENT", "Sent"),
        ("FAILED", "Failed"),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='DRAFT')

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )

    scheduled_at = models.DateTimeField(
        null=True,
        blank=True
    )

    retry_count = models.PositiveIntegerField(default=0)


class Attachment(models.Model):
    email = models.ForeignKey(Email, related_name="attachments", on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment for Email {self.email.id}"

class GeneralSettings(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="general_settings"
    )
    time_zone = models.CharField(max_length=64, default="UTC")
    desktop_notifications_enabled = models.BooleanField(default=True)
    sound_notifications_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)




class ChatRoom(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="chat_rooms")
    related_email = models.OneToOneField(
        Email,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_room"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name or f"Room {self.id}"

class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="sent_chat_messages", on_delete=models.CASCADE)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='replies')
    TYPE_CHOICES = (
        ('TEXT', 'Text'),
        ('SYSTEM', 'System Alert'),
        ('FILE', 'File'),
    )
    message_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='TEXT')
    content = models.TextField(blank=True, null=True)
    attachment = models.FileField(upload_to='chat_attachments/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="read_messages", blank=True)
    starred_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="starred_chat_messages", blank=True)
    is_deleted = models.BooleanField(default=False)
    is_forwarded = models.BooleanField(default=False)
    mentions = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="mentioned_in_messages", blank=True)
    
    def __str__(self):
        return f"{self.sender.email}: {str(self.content)[:20]}"

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#FFFFFF")

    def __str__(self):
        return self.name

class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="owned_projects", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="created_tasks", on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="assigned_tasks", null=True, blank=True, on_delete=models.SET_NULL) 
    due_date = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, related_name="tasks", blank=True)
    project = models.ForeignKey(Project, related_name="tasks", on_delete=models.CASCADE, null=True, blank=True)
    
    PRIORITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    )
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    email = models.ForeignKey(Email, null=True, blank=True, on_delete=models.SET_NULL)
    
    STATUS_CHOICES = (
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    
    full_name = models.CharField(max_length=150)
    display_name = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)  
    tokens_valid_after = models.DateTimeField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)  
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_format = models.CharField(max_length=20, default="DD-MM-YYYY")
    language = models.CharField(max_length=20, default="en")
    store_activity = models.BooleanField(default=True)
    is_2fa_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)


    STATUS_AVAILABLE_NOW = "available_now"
    STATUS_AVAILABLE = "available"
    STATUS_BUSY = "busy"
    STATUS_DND = "dnd"
    STATUS_AWAY = "away"
    STATUS_OFFLINE = "offline"
    STATUS_OOO = "out_of_office"

    STATUS_CHOICES = [
    (STATUS_AVAILABLE_NOW, "Available now"),
    (STATUS_AVAILABLE, "Available"),
    (STATUS_BUSY, "Busy"),
    (STATUS_DND, "Do not disturb"),
    (STATUS_AWAY, "Appear away"),
    (STATUS_OFFLINE, "Offline"),
    (STATUS_OOO, "Out of office"),
]

    presence_status = models.CharField(
    max_length=30,
    choices=STATUS_CHOICES,
    default=STATUS_AVAILABLE,
)

    status_message = models.CharField(
    max_length=255,
    blank=True,
    default=""
)


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(default=timezone.now)
    
    def update_presence(self, online: bool):
        self.is_online = online
        self.last_seen = timezone.now()
        self.save(update_fields=['is_online', 'last_seen'])

    def __str__(self):
        return self.user.username

class LoginActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="login_activities", on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.timestamp}"

class Meeting(models.Model):
    host = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="hosted_meetings", on_delete=models.CASCADE)
    title = models.CharField(max_length=255, default="New Meeting")
    meeting_code = models.CharField(max_length=50, unique=True)
    chat_room = models.OneToOneField(
        ChatRoom, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="meeting"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    TYPE_CHOICES = (
        ('audio', 'Audio Call'),
        ('video', 'Video Call'),
        ('group', 'Group Call'),
    )
    call_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='video')
    
    def __str__(self):
        return f"{self.title} ({self.meeting_code}) - {self.call_type}"

class Note(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Event(models.Model):

    title = models.CharField(max_length=255)

    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="events",
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_events"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category_name = models.CharField(max_length=255, null=True, blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    
    def clean(self):
        if self.end_datetime <= self.start_datetime:
            raise ValidationError("End time must be after start time")
        
class EventAttendee(models.Model):

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
        ("maybe", "Maybe"),
    )

    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("guest", "Guest"),
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="attendees"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_participations"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="guest"
    )

    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "user")
        indexes = [
            models.Index(fields=["event", "user"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.event.title} ({self.status})"
    

class EventReminder(models.Model):

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="reminders"
    )

    minutes_before = models.PositiveIntegerField()

    class Meta:
        ordering = ["minutes_before"]
        indexes = [
            models.Index(fields=["event"]),
        ]

    def __str__(self):
        return f"{self.minutes_before} min before - {self.event.title}"

class GovernmentHoliday(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date"]
        verbose_name = "Government Holiday"
        verbose_name_plural = "Government Holidays"

    def __str__(self):
        return f"{self.name} ({self.date})"

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE)
    message = models.CharField(max_length=255)

    TYPE_CHOICES = (
        ('email', 'Email'),
        ('meet', 'Meeting'),
        ('chat', 'Chat'),
        ('task', 'Task'),
        ('system', 'System'),
    )
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='system')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True)
    object_id = models.PositiveIntegerField(null=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    def __str__(self):
        return f"Notification for {self.recipient}: {self.message}"

class TaskComment(models.Model):
    task = models.ForeignKey(Task, related_name="comments", on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="task_comments", on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.title}"

class TaskActivity(models.Model):
    task = models.ForeignKey(Task, related_name="activity_log", on_delete=models.CASCADE)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="actions", on_delete=models.CASCADE)
    action_type = models.CharField(max_length=50)
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor.email} - {self.action_type}"

class MessageReaction(models.Model):
    message = models.ForeignKey(ChatMessage, related_name="reactions", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="message_reactions", on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user', 'emoji')

    def __str__(self):
        return f"{self.user.email} reacted {self.emoji} to {self.message.id}"
    
class DriveFile(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="drive_files")
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to="drive/")
    size = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=100, default="application/octet-stream")
    uploaded_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    shared_with = models.ManyToManyField(User,related_name="shared_files",blank=True)
    is_favorite = models.BooleanField(default=False)
    is_trashed = models.BooleanField(default=False)

    def __str__(self):
        return self.original_name  


class EmailTemplate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="email_templates", on_delete=models.CASCADE)
    title = models.CharField(max_length=100, help_text="Short name like 'Weekly Report'")
    body = models.TextField(help_text="The actual email content")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'title') 

    def __str__(self):
        return f"{self.user.email} - {self.title}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        
@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()        

class Call(models.Model):
    room = models.ForeignKey('ChatRoom', on_delete=models.CASCADE, related_name='calls')
    caller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='calls_made')
    jitsi_meeting_id = models.CharField(max_length=255, unique=True)
    
    STATUS_CHOICES = [
        ('RINGING', 'Ringing'),
        ('ONGOING', 'Ongoing'),
        ('ENDED', 'Ended'),
        ('MISSED', 'Missed')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='RINGING')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Call {self.id} in Room {self.room.id} - {self.status}"