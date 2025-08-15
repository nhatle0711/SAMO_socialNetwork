from django.shortcuts import render
# Create your views here.
def home(request):
    return render(request,'account/home.html')



from allauth.account.views import LoginView, SignupView, LogoutView

class CustomLoginView(LoginView):
    template_name = 'account/login.html'

class CustomSignupView(SignupView):
    template_name = 'account/signup.html'

class CustomLogoutView(LogoutView):
    template_name = 'account/logout.html'

from allauth.account.views import LoginView, SignupView


