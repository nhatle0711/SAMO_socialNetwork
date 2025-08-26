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
    image = models.ImageField(upload_to='posts/')  # ảnh bài post
    created_at = models.DateTimeField(auto_now_add=True)
    hearts = models.ManyToManyField(User, related_name="hearted_posts", blank=True)
    def __str__(self):
        return f"Post by {self.user.username} at {self.created_at}"


# Follow (n-n thông qua 2 FK trỏ về User)
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")  # người follow
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")  # người được follow
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')  # tránh follow trùng lặp

    def __str__(self):
        return f"{self.follower.username} -> {self.following.username}"
