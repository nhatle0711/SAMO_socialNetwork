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
    const postElement = btn.closest('.post') || btn.closest('.pm-post');
    if (!postElement) return console.error("Không tìm thấy phần tử post hoặc pm-post!");

    const postId = postElement.dataset.postId;

    // ✅ Sửa dòng này:
    const heartIcon =
        btn.querySelector('.heart-icon') || btn.querySelector('.pm-heart-icon');

    // ✅ Tương tự với lượt thích
    const likesCount =
        postElement.querySelector('.likes-count') ||
        postElement.querySelector('.pm-likes');

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
            if (heartIcon)
                heartIcon.innerHTML = '<i class="fas fa-heart" style="color:#ed4956"></i>';
        } else {
            btn.classList.remove('liked');
            if (heartIcon)
                heartIcon.innerHTML = '<i class="far fa-heart"></i>';
        }

        if (likesCount)
            likesCount.textContent = `${data.likes_count} lượt thích`;
    })
    .catch(err => console.error("Like error:", err));
}


// ================= BOOKMARK =================
function toggleSave(button) {
    const postId = button.dataset.postId;

    fetch(`/posts/${postId}/save/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(res => res.json())
    .then(data => {
        // Hỗ trợ cả 2 class: save-icon & pm-save-icon
        const icon =
            button.querySelector('.save-icon i') ||
            button.querySelector('.pm-save-icon i');

        if (!icon) return; // Không tìm thấy icon thì bỏ qua

        if (data.saved) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = 'gold';
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
        }
    })
    .catch(err => console.error('Save error:', err));
}

// Hàm lấy CSRF token (nếu chưa có)
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
    const postElement = button.closest('.pm-post') || button.closest('.post');
    if (!postElement) return console.error("Không tìm thấy post element!");

    const commentInput = postElement.querySelector('.pm-input') || postElement.querySelector('.comment-input');
    const commentText = commentInput.value.trim();
    const postId = postElement.dataset.postId;

    if (!commentText) return;

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
        commentInput.value = '';
        // Gọi lại API để lấy danh sách comment mới nhất
        refreshComments(postElement, postId);
    })
    .catch(err => console.error("Post comment error:", err));
}

// Hàm cập nhật lại danh sách bình luận
function refreshComments(postElement, postId) {
    fetch(`/post/${postId}/detail/`)
        .then(res => res.json())
        .then(data => {
            const commentsList =
                postElement.querySelector('.pm-comments-list') ||
                postElement.querySelector('.comments-list');
            if (!commentsList) return;

            let html = '';
            data.comments.forEach(c => {
                html += `
                    <div class="${postElement.classList.contains('pm-post') ? 'pm-comment' : 'comment'}">
                        <img src="${c.avatar}" class="${postElement.classList.contains('pm-post') ? 'pm-avatar' : 'avatar'}" alt="${c.user}">
                        <div>
                            <b>${c.user}</b> ${c.text}
                            <div class="${postElement.classList.contains('pm-post') ? 'pm-comment-time' : 'comment-time'}">${c.time}</div>
                        </div>
                    </div>
                `;
            });
            commentsList.innerHTML = html;
        })
        .catch(err => console.error("Refresh comments error:", err));
}


//Nhấn Enter đăng comment và shift-enter xuống dòng
document.addEventListener('DOMContentLoaded', function() {
    // Áp dụng cho cả .comment-input (post ngoài) và .pm-input (trong PM)
    const commentInputs = document.querySelectorAll('.comment-input, .pm-input');

    commentInputs.forEach(input => {
        const button = input.nextElementSibling; // nút Đăng nằm ngay sau input

        // Khi người dùng gõ vào input
        input.addEventListener('input', function() {
            if (this.value.trim() !== "") {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });

        // Enter để đăng, Shift+Enter xuống dòng
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
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
