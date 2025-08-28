from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Profile, Post,Follow
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import PostForm,ProfileForm
from django.http import JsonResponse
from django.contrib import messages

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

    context = {
        'posts': posts,
        'suggested_users': suggested_users
    }
    return render(request,'account/home.html',context)

from allauth.account.views import LoginView, SignupView, LogoutView

class CustomLoginView(LoginView):
    template_name = 'account/login.html'

class CustomSignupView(SignupView):
    template_name = 'account/signup.html'

class CustomLogoutView(LogoutView):
    template_name = 'account/logout.html'
#endregion

#region profile
# views.py
@login_required
def profile_view(request, username):
    profile_user = get_object_or_404(User, username=username)
    posts = Post.objects.filter(user=profile_user).order_by('-created_at')

    # Kiểm tra xem current user có đang follow profile_user không
    is_following = False
    if request.user.is_authenticated and request.user != profile_user:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).exists()

    context = {
        'profile_user': profile_user,
        'posts': posts,
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
@login_required
def create_post(request):
    if request.method == "POST":
        form = PostForm(request.POST, request.FILES)  # nhớ có request.FILES để upload ảnh
        if form.is_valid():
            post = form.save(commit=False)
            post.user = request.user  # gán user hiện tại
            post.save()
            return redirect("home")  # về trang chủ hoặc trang bạn muốn
    else:
        form = PostForm()
    return render(request, "posts/create_post.html", {"form": form})

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
