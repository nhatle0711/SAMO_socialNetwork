from django.urls import path, include
from .views import home, CustomLoginView, CustomSignupView, CustomLogoutView
from . import views
from django.conf.urls.static import static
from django.conf import settings
urlpatterns = [
    path('', home, name='home'),

    # Override URL mặc định của Allauth
    path('accounts/login/', CustomLoginView.as_view(), name='account_login'),
    path('accounts/signup/', CustomSignupView.as_view(), name='account_signup'),
    path('accounts/logout/', CustomLogoutView.as_view(), name='account_logout'),
    path('create_post/', views.create_post_api, name='create_post_api'),
    path("posts/<int:post_id>/like/", views.toggle_like, name="toggle_like"),
    path('posts/<int:post_id>/save/', views.toggle_save_post, name='toggle_save_post'),
    path("posts/<int:post_id>/comments/", views.add_comment, name="add_comment"),
    path("post/<int:post_id>/detail/", views.post_detail_api, name="post_detail_api"),

    # Giữ các URL khác của Allauth
    path('accounts/', include('allauth.urls')),
    path("profile/<str:username>/", views.profile_view, name="profile"),
    path("edit-profile/", views.edit_profile, name="edit_profile"),
    path('follow/<str:username>/', views.follow_user, name='follow_user'),
    path("search-users/", views.search_users, name="search_users"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
