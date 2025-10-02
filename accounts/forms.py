from django import forms
from .models import Post, Profile, Media

class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content']


class MediaForm(forms.ModelForm):
    class Meta:
        model = Media
        fields = ['file', 'media_type']

class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['avatar', 'bio']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Giới thiệu bản thân...'})
        }