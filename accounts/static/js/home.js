
    function toggleLike(btn) {
        const heartIcon = btn.querySelector('.heart-icon');
        const likesCount = btn.closest('.post').querySelector('.likes-count');

        if (btn.classList.contains('liked')) {
            btn.classList.remove('liked');
            heartIcon.innerHTML = '<i class="far fa-heart"></i>';
            const currentLikes = parseInt(likesCount.textContent.split(' ')[0]);
            likesCount.textContent = `${currentLikes - 1} lượt thích`;
        } else {
            btn.classList.add('liked');
            heartIcon.innerHTML = '<i class="fas fa-heart" style="color: #ed4956"></i>';
            const currentLikes = parseInt(likesCount.textContent.split(' ')[0]);
            likesCount.textContent = `${currentLikes + 1} lượt thích`;
        }
    }

    function toggleSave(btn) {
        const saveIcon = btn.querySelector('.save-icon');

        if (btn.classList.contains('saved')) {
            btn.classList.remove('saved');
            saveIcon.innerHTML = '<i class="far fa-bookmark"></i>';
        } else {
            btn.classList.add('saved');
            saveIcon.innerHTML = '<i class="fas fa-bookmark" style="color: #262626"></i>';
        }
    }

    // Double tap to like
    document.querySelectorAll('.post-image').forEach(image => {
        image.addEventListener('dblclick', function() {
            const likeBtn = this.closest('.post').querySelector('.like-btn');
            toggleLike(likeBtn);

            // Show heart animation
            const heart = document.createElement('div');
            heart.innerHTML = '<i class="fas fa-heart"></i>';
            heart.classList.add('heart-animation');
            this.parentElement.appendChild(heart);

            setTimeout(() => {
                heart.remove();
            }, 1000);
        });
    });
// Hàm để hiển thị/ẩn bình luận
function toggleComments(element) {
    const commentsList = element.nextElementSibling;
    if (commentsList.style.display === 'none') {
        commentsList.style.display = 'block';
        element.textContent = 'Ẩn bình luận';

        // Nếu chưa tải bình luận, thực hiện tải
        if (commentsList.children.length === 0) {
            loadComments(element);
        }
    } else {
        commentsList.style.display = 'none';
        element.textContent = 'Xem tất cả bình luận';
    }
}

// Hàm tải bình luận (giả lập)
function loadComments(element) {
    const commentsList = element.nextElementSibling;
    const postId = element.closest('.post').dataset.postId;

    // Chỉ thêm nếu chưa load dữ liệu mock
    if (!commentsList.dataset.loaded) {
        const mockComments = [
            {user: 'user1', text: 'Bài viết hay quá!', time: '2 giờ trước'},
            {user: 'user2', text: 'Tôi rất thích nội dung này.', time: '1 giờ trước'}
        ];

        mockComments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <a href="/profile/${comment.user}" class="username">${comment.user}</a>
                <span class="comment-text">${comment.text}</span>
                <div class="comment-time">${comment.time}</div>
            `;
            commentsList.appendChild(commentElement);
        });

        // Đánh dấu là đã load
        commentsList.dataset.loaded = "true";
    }
}

// Hàm đăng bình luận mới
function postComment(button) {
    const commentInput = button.previousElementSibling;
    const commentText = commentInput.value.trim();

    if (commentText === '') {
        return; // Không đăng bình luận rỗng
    }

    const commentsList = button.closest('.comments').querySelector('.comments-list');
    const postElement = button.closest('.post');
    const postId = postElement.dataset.postId;

    // Tạo phần tử bình luận mới
    const newComment = document.createElement('div');
    newComment.className = 'comment';
    newComment.innerHTML = `
        <a href="/profile/current_user" class="username">Bạn</a>
        <span class="comment-text">${commentText}</span>
        <div class="comment-time">Vừa xong</div>
    `;

    // Thêm bình luận vào đầu danh sách
    commentsList.appendChild(newComment);

    // Hiển thị danh sách bình luận nếu đang ẩn
    if (commentsList.style.display === 'none') {
        commentsList.style.display = 'block';
    }

    // Xóa nội dung ô nhập
    commentInput.value = '';

    // Trong thực tế, bạn sẽ gửi yêu cầu AJAX đến server ở đây
    /*
    fetch(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') // Nếu dùng Django CSRF
        },
        body: JSON.stringify({
            text: commentText
        })
    })
    .then(response => response.json())
    .then(data => {
        // Cập nhật giao diện với dữ liệu từ server
    })
    .catch(error => {
        console.error('Lỗi:', error);
    });
    */
}

// Hàm hỗ trợ lấy CSRF token (nếu dùng Django)
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

// Thêm sự kiện nhấn Enter để đăng bình luận
document.addEventListener('DOMContentLoaded', function() {
    const commentInputs = document.querySelectorAll('.comment-input');
    commentInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const postButton = this.nextElementSibling;
                postComment(postButton);
            }
        });
    });
});
    document.addEventListener('DOMContentLoaded', function() {
    const commentInputs = document.querySelectorAll('.comment-input');
    commentInputs.forEach(input => {
        const button = input.nextElementSibling;

        // Khi nhập vào ô comment
        input.addEventListener('input', function() {
            if (this.value.trim() !== "") {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });

        // Nhấn Enter thì cũng đăng
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const postButton = this.nextElementSibling;
                postComment(postButton);
            }
        });
    });
});

