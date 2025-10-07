from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Profile, Post,Follow, Media,Comment
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import PostForm,ProfileForm
from django.http import JsonResponse
from django.contrib import messages
from django.db.models import Q
from .models import SavePost
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from django.utils import timezone
from allauth.account.views import LoginView, SignupView, LogoutView

def time_since(dt):
    now = timezone.now()
    diff = now - dt

    seconds = diff.total_seconds()
    minutes = seconds // 60
    hours = seconds // 3600
    days = diff.days

    if seconds < 60:
        return "Vừa xong"
    elif minutes < 60:
        return f"{int(minutes)} phút trước"
    elif hours < 24:
        return f"{int(hours)} giờ trước"
    elif days < 7:
        return f"{int(days)} ngày trước"
    elif days < 30:
        return f"{int(days // 7)} tuần trước"
    elif days < 365:
        return f"{int(days // 30)} tháng trước"
    else:
        return f"{int(days // 365)} năm trước"
# Create your views here.

#region home
@login_required
def home(request):

    # lấy list id những người mà user đang follow
    following_ids = Follow.objects.filter(
        follower=request.user
    ).values_list('following_id', flat=True)
    # Lấy user gợi ý: không phải mình + không nằm trong danh sách đã follow
    suggested_users = User.objects.exclude(id=request.user.id).exclude(id__in=following_ids).exclude(is_superuser=True).exclude(is_staff=True)[:5]
    # lấy post từ những người đó
    posts = Post.objects.filter(user__id__in=following_ids).order_by('-created_at')
    for post in posts:
        post.is_saved = post.is_saved_by(request.user)
    context = {
        'posts': posts,
        'suggested_users': suggested_users
    }
    return render(request,'account/home.html',context)



class CustomLoginView(LoginView):
    template_name = 'account/login.html'

class CustomSignupView(SignupView):
    template_name = 'account/signup.html'

class CustomLogoutView(LogoutView):
    template_name = 'account/logout.html'
#endregion

def search_users(request):
    query = request.GET.get("q", "")
    results = []

    if query:
        users = User.objects.filter(Q(username__icontains=query))[:10]
        for u in users:
            # Lấy avatar từ profile (nếu có)
            try:
                avatar_url = u.profile.avatar.url
            except:
                avatar_url = "/media/avatars/default.png"

            results.append({
                "username": u.username,
                "avatar": avatar_url,
            })

    return JsonResponse({"results": results})


#region profile
# views.py
@login_required
def profile_view(request, username):
    profile_user = get_object_or_404(User, username=username)
    # Bài viết user đăng
    posts = Post.objects.filter(user=profile_user).prefetch_related("medias")

    # Bài viết user đã lưu
    saved_posts = Post.objects.filter(saves__user=profile_user).prefetch_related("medias")


    is_following = False
    if request.user.is_authenticated and request.user != profile_user:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).exists()

    context = {
        'profile_user': profile_user,
        'posts': posts,
        'saved_posts': saved_posts,
        'posts_count': posts.count(),
        'followers_count': profile_user.followers.count(),
        'following_count': profile_user.following.count(),
        'is_following': is_following,
    }
    return render(request, 'profile/profile.html', context)
@login_required
def edit_profile(request):
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = ProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return redirect("profile", username=request.user.username)
    else:
        form = ProfileForm(instance=profile)

    return render(request, "profile/edit_profile.html", {"form": form})
#endregion

#region post
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Post, Comment

@login_required
def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if request.user in post.hearts.all():
        post.hearts.remove(request.user)
        liked = False
    else:
        post.hearts.add(request.user)
        liked = True
    return JsonResponse({
        "liked": liked,
        "likes_count": post.hearts.count()
    })
@login_required
def toggle_save_post(request, post_id):
    if request.method == "POST":
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found"}, status=404)

        saved_post, created = SavePost.objects.get_or_create(user=request.user, post=post)

        if not created:
            saved_post.delete()
            return JsonResponse({"saved": False})
        else:
            return JsonResponse({"saved": True})
    return JsonResponse({"error": "Invalid request"}, status=400)
@login_required
def add_comment(request, post_id):
    if request.method == "POST":
        post = get_object_or_404(Post, id=post_id)
        data = json.loads(request.body)
        text = data.get("text")

        comment = Comment.objects.create(
            post=post,
            user=request.user,
            content=text
        )

        return JsonResponse({
            "user": request.user.username,
            "content": comment.content,
            "time": comment.created_at.strftime("%H:%M %d/%m/%Y")
        })
@login_required
def post_detail_api(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    return JsonResponse({
        "avatar":  post.user.profile.avatar.url,
        "id": post.id,
        "user": post.user.username,
        "content": post.content,
        "likes": post.hearts.count(),
       "liked": post.hearts.filter(id=request.user.id).exists(),
        "medias": [{"url": m.file.url, "type": m.media_type} for m in post.medias.all()],
        "created_at": time_since(post.created_at),
        "is_saved": post.is_saved_by(request.user),
        "comments": [
                {
                    "avatar": c.user.profile.avatar.url,
                    "user": c.user.username,
                    "text": c.content,
                    "time": time_since(c.created_at),
                }
            for c in post.comments.all().order_by("-created_at")
            ]
    })

@login_required
@require_POST
def create_post_api(request):
    if request.method == "POST":
        content = request.POST.get("content", "")
        files = request.FILES.getlist("media")

        if not files:
            return JsonResponse({"error": "Bạn phải chọn ít nhất một ảnh hoặc video"}, status=400)

        post = Post.objects.create(user=request.user, content=content)
        media_urls = []

        for f in files:
            if f.content_type.startswith("image"):
                media_type = "image"
            elif f.content_type.startswith("video"):
                media_type = "video"
            else:
                continue

            media = Media.objects.create(post=post, file=f, media_type=media_type)
            media_urls.append({
                "url": media.file.url,
                "type": media_type
            })

        return JsonResponse({
            "success": True,
            "id": post.id,
            "username": post.user.username,
            "avatar": getattr(post.user.profile.avatar, "url", ""),
            "content": post.content,
            "medias": media_urls,
            "created_at": post.created_at.strftime("%Y-%m-%d %H:%M"),
        })

    return JsonResponse({"error": "Invalid request"}, status=400)

#endregion


#region follow
@login_required
def follow_user(request, username):
    if request.method == 'POST':
        user_to_follow = get_object_or_404(User, username=username)

        # Kiểm tra đã follow chưa
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )

        if created:
            # Follow thành công
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'followed',
                    'followers_count': user_to_follow.followers.count()
                })
            messages.success(request, f'Đã theo dõi {user_to_follow.username}')
        else:
            # Đã follow rồi, thực hiện unfollow
            follow.delete()
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'unfollowed',
                    'followers_count': user_to_follow.followers.count()
                })
            messages.info(request, f'Đã hủy theo dõi {user_to_follow.username}')

        return redirect('profile', username=username)

    return redirect('profile', username=username)
#endregion
