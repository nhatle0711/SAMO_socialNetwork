from django.urls import path, include
from .views import home, CustomLoginView, CustomSignupView, CustomLogoutView

urlpatterns = [
    path('', home, name='home'),

    # Override URL mặc định của Allauth
    path('accounts/login/', CustomLoginView.as_view(), name='account_login'),
    path('accounts/signup/', CustomSignupView.as_view(), name='account_signup'),
    path('accounts/logout/', CustomLogoutView.as_view(), name='account_logout'),

    # Giữ các URL khác của Allauth
    path('accounts/', include('allauth.urls')),
]
