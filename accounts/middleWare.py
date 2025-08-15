from django.shortcuts import redirect
from django.urls import reverse

class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        allowed_paths = [
            reverse('account_login'),
            reverse('account_signup'),
            reverse('account_logout'),
            '/admin/',
            '/static/',  # Cho phép load CSS/JS
        ]

        if not request.user.is_authenticated:
            if not any(request.path.startswith(path) for path in allowed_paths):
                return redirect('account_login')
        return self.get_response(request)
