from django.db import models

# Create your models here.
from django.contrib.auth.models import User


# Hồ sơ người dùng (Profile)
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Liên kết 1-1
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png')

    def __str__(self):
        return self.user.username

    @staticmethod
    def get_or_create_profile(user):
        profile, created = Profile.objects.get_or_create(user=user)
        return profile

# Bài viết (Post)
class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    hearts = models.ManyToManyField(User, related_name="hearted_posts", blank=True)
    def __str__(self):
        return f"Post by {self.user.username} at {self.created_at}"
    class Meta:
            ordering = ['-created_at']
class Media(models.Model):
    MEDIA_TYPE_CHOICES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )

    post = models.ForeignKey(Post, related_name="medias", on_delete=models.CASCADE)
    file = models.FileField(upload_to='posts/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES)
    def __str__(self):
        return f"{self.media_type} for Post {self.post.id}"
class Comment(models.Model):
    post = models.ForeignKey(Post, related_name="comments", on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name="replies",
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on Post {self.post.id}"
class CommentLike(models.Model):
    comment = models.ForeignKey(Comment, related_name="likes", on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user')
class SavePost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_posts")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="saves")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')  # 1 user không thể lưu 1 post nhiều lần
        verbose_name = "Saved Post"
        verbose_name_plural = "Saved Posts"

    def __str__(self):
        return f"{self.user.username} saved Post {self.post.id}"

# Follow (n-n thông qua 2 FK trỏ về User)
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")  # người follow
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")  # người được follow
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')  # tránh follow trùng lặp

    def __str__(self):
        return f"{self.follower.username} -> {self.following.username}"
