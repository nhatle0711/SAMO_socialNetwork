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
    path("create/", views.create_post, name="create_post"),
    # Giữ các URL khác của Allauth
    path('accounts/', include('allauth.urls')),
    path("profile/<str:username>/", views.profile_view, name="profile"),
    path("edit-profile/", views.edit_profile, name="edit_profile"),
    path('follow/<str:username>/', views.follow_user, name='follow_user'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
