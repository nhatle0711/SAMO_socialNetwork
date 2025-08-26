from django import forms
from .models import Post
from .models import Profile


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'image']

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['avatar', 'bio']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Giới thiệu bản thân...'})
        }