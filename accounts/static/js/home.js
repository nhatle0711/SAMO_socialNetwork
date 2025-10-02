const carouselState = {};

// ================= CAROUSEL =================
function moveSlide(postId, direction) {
    const track = document.querySelector(`.post-media-carousel[data-post-id="${postId}"] .carousel-track`);
    const items = track.querySelectorAll(".carousel-item");
    const dots = document.querySelectorAll(`#dots-${postId} .dot`);

    if (!carouselState[postId]) carouselState[postId] = 0;
    let newIndex = carouselState[postId] + direction;

    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    carouselState[postId] = newIndex;
    track.style.transform = `translateX(-${newIndex * 100}%)`;

    if (dots.length) {
        dots.forEach(dot => dot.classList.remove("active"));
        dots[newIndex].classList.add("active");
    }
}

function goToSlide(postId, index) {
    const track = document.querySelector(`.post-media-carousel[data-post-id="${postId}"] .carousel-track`);
    const dots = document.querySelectorAll(`#dots-${postId} .dot`);

    carouselState[postId] = index;
    track.style.transform = `translateX(-${index * 100}%)`;

    if (dots.length) {
        dots.forEach(dot => dot.classList.remove("active"));
        dots[index].classList.add("active");
    }
}

// ================= LIKE =================
function toggleLike(btn) {
    const postElement = btn.closest('.post');
    const postId = postElement.dataset.postId;
    const heartIcon = btn.querySelector('.heart-icon');
    const likesCount = postElement.querySelector('.likes-count');

    const liked = btn.classList.contains('liked');

    fetch(`/posts/${postId}/like/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(res => res.json())
    .then(data => {
        if (data.liked) {
            btn.classList.add('liked');
            heartIcon.innerHTML = '<i class="fas fa-heart" style="color: #ed4956"></i>';
        } else {
            btn.classList.remove('liked');
            heartIcon.innerHTML = '<i class="far fa-heart"></i>';
        }
        likesCount.textContent = `${data.likes_count} lượt thích`;
    })
    .catch(err => console.error("Like error:", err));
}

// Double tap like (ảnh / video)
document.querySelectorAll('.post-image, .post-video').forEach(media => {
    media.addEventListener('dblclick', function() {
        const likeBtn = this.closest('.post').querySelector('.like-btn');
        toggleLike(likeBtn);

        const heart = document.createElement('div');
        heart.innerHTML = '<i class="fas fa-heart"></i>';
        heart.classList.add('heart-animation');
        this.parentElement.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
    });
});

// ================= BOOKMARK =================
function toggleSave(btn) {
    const postElement = btn.closest('.post');
    const postId = postElement.dataset.postId;
    const saveIcon = btn.querySelector('.save-icon');

    fetch(`/posts/${postId}/save/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(res => res.json())
    .then(data => {
        if (data.saved) {
            btn.classList.add('saved');
            saveIcon.innerHTML = '<i class="fas fa-bookmark" style="color: #262626"></i>';
        } else {
            btn.classList.remove('saved');
            saveIcon.innerHTML = '<i class="far fa-bookmark"></i>';
        }
    })
    .catch(err => console.error("Save error:", err));
}

// ================= COMMENTS =================
function toggleComments(element) {
    const commentsList = element.nextElementSibling;
    const postId = element.closest('.post').dataset.postId;

    if (commentsList.style.display === 'none') {
        commentsList.style.display = 'block';
        element.textContent = 'Ẩn bình luận';

        if (!commentsList.dataset.loaded) {
            loadComments(postId, commentsList);
        }
    } else {
        commentsList.style.display = 'none';
        element.textContent = 'Xem tất cả bình luận';
    }
}

function loadComments(postId, commentsList) {
    fetch(`/posts/${postId}/comments/`)
        .then(res => res.json())
        .then(data => {
            commentsList.innerHTML = "";
            data.comments.forEach(c => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <a href="/profile/${c.user}" class="username">${c.user}</a>
                    <span class="comment-text">${c.text}</span>
                    <div class="comment-time">${c.time}</div>
                `;
                commentsList.appendChild(commentElement);
            });
            commentsList.dataset.loaded = "true";
        })
        .catch(err => console.error("Load comments error:", err));
}

function postComment(button) {
    const commentInput = button.previousElementSibling;
    const commentText = commentInput.value.trim();
    const postElement = button.closest('.post');
    const postId = postElement.dataset.postId;
    const commentsList = postElement.querySelector('.comments-list');

    if (commentText === '') return;

    fetch(`/posts/${postId}/comments/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ text: commentText })
    })
    .then(res => res.json())
    .then(data => {
        const newComment = document.createElement('div');
        newComment.className = 'comment';
        newComment.innerHTML = `
            <a href="/profile/${data.user}" class="username">${data.user}</a>
             <span class="comment-text">${data.content}</span>
            <div class="comment-time">${data.time}</div>
        `;
        commentsList.appendChild(newComment);
        commentsList.style.display = 'block';
        commentInput.value = '';
    })
    .catch(err => console.error("Post comment error:", err));
}

// Enter để đăng comment
document.addEventListener('DOMContentLoaded', function() {
    const commentInputs = document.querySelectorAll('.comment-input');
    commentInputs.forEach(input => {
        const button = input.nextElementSibling;

        input.addEventListener('input', function() {
            if (this.value.trim() !== "") button.classList.add("active");
            else button.classList.remove("active");
        });

        input.addEventListener('keypress', function(e) {
           if (e.key === 'Enter') {
                e.preventDefault();
                postComment(button);
            }
        });
    });
});

//Bình luận ngắn → hiển thị giống input 1 dòng.
//Bình luận dài → tự động xuống dòng, tự động giãn chiều cao (tối đa 120px).
document.querySelectorAll(".comment-input").forEach(textarea => {
    textarea.addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    });
});

// ================= CSRF helper =================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
