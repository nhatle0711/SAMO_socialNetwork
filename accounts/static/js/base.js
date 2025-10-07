// ========== Hàm mở modal ==========
window.openPostModal = function(postId) {
    document.body.style.overflow = "hidden"; // chặn scroll trang chính
    const modal = document.getElementById("pm-postModal");
    modal.style.display = "flex";

    // Reset nội dung cũ
    document.getElementById("pm-left").innerHTML = "";
    document.getElementById("pm-right").innerHTML = "Đang tải...";

    fetch(`/post/${postId}/detail/`)
        .then(res => res.json())
        .then(data => {
            // ========== Bên trái: Media ==========
            const left = document.getElementById("pm-left");
            if (data.medias.length > 0) {
                data.medias.forEach(m => {
                    if (m.type === "image") {
                        left.innerHTML += `<img src="${m.url}" class="pm-media">`;
                    } else if (m.type === "video") {
                        left.innerHTML += `<video controls src="${m.url}" class="pm-media"></video>`;
                    }
                });
            } else {
                left.innerHTML = `<div class="pm-no-media">Không có media</div>`;
            }

            // ========== Bên phải ==========
            let rightHtml = `
            <div class="pm-post" data-post-id="${data.id}">
                <!-- Header -->
                <div class="pm-header">
                   <div class="pm-profile">
                    <img src="${data.avatar}" alt="${data.user}" class="pm-avatar">
                    <span class="pm-username"><b>${data.user}</b></span>
                   </div>
                    <button class="options-btn">⋯</button>
                </div>
                <hr>



                <!-- Comments -->
                    <div class="pm-comments-box ${data.comments.length === 0 ? "no-comments" : "has-comments"}">


                        <!-- Danh sách comment -->
                        <div class="pm-comments-list">
                `;

            if (data.comments.length > 0) {
            if (data.content && data.content.trim() !== "") {
                        rightHtml += `
                        <!-- Caption hiển thị giống comment -->
                        <div class="pm-comment pm-caption">
                            <img src="${data.avatar}" class="pm-avatar" alt="${data.user}">
                            <div>
                                <b>${data.user}</b> ${data.content}
                                <div class="pm-comment-time">${data.created_at}</div>
                            </div>
                        </div>
                    `;
                     }
                data.comments.forEach(c => {
                    rightHtml += `
                        <div class="pm-comment">
                            <img src="${c.avatar}" class="pm-avatar" alt="${c.user}">
                            <div>
                                <b>${c.user}</b> ${c.text}
                                <div class="pm-comment-time">${c.time}</div>
                            </div>
                        </div>
                    `;
                });
            } else {
                rightHtml += `
                    <div class="pm-no-comments">
                        <p><b>Chưa có bình luận nào.</b></p>
                        <p>Bắt đầu trò chuyện.</p>
                    </div>
                `;
            }

            rightHtml += `
                    </div> <!-- đóng comments-list -->
                </div> <!-- đóng comments-box -->

                <!-- Actions -->
                <div class="pm-actions">
                    <button class="pm-btn pm-like-btn" onclick="toggleLike(this)">
                        <span class="pm-heart-icon">
                            ${data.liked
                                ? '<i class="fas fa-heart" style="color:#ed4956"></i>'
                                : '<i class="far fa-heart"></i>'}
                        </span>
                    </button>
                    <button class="pm-btn"><i class="far fa-comment"></i></button>
                    <button class="pm-btn"><i class="far fa-paper-plane"></i></button>
                    <button class="pm-btn pm-save-btn"  data-post-id="${data.id}"  onclick="toggleSave(this)">
                        <span class="pm-save-icon"><span class="pm-save-icon">
              ${data.is_saved
                  ? '<i class="fas fa-bookmark" style="color: gold"></i>'
                  : '<i class="far fa-bookmark"></i>'}
          </span></span>
                    </button>
                </div>

                <!-- Stats -->
                <div class="pm-stats">
                    <div class="pm-likes">${data.likes} lượt thích</div>
                    <div class="pm-time">${data.created_at}</div>
                </div>

                <!-- Add comment -->
                <div class="pm-add-comment">
                    <textarea placeholder="Thêm bình luận..."
                              class="pm-input" id="pm-input-${data.id}"></textarea>
                    <button class="pm-comment-btn" onclick="postComment(this)">Đăng</button>
                </div>
            </div> <!-- đóng .pm-post -->
            `;

            document.getElementById("pm-right").innerHTML = rightHtml;
        })
        .catch(err => {
            console.error("Error loading post detail:", err);
            document.getElementById("pm-right").innerHTML =
                "<p style='color:red;'>Không tải được dữ liệu bài viết.</p>";
        });
};

// ========== Hàm đóng modal ==========
window.closePostModal = function() {
   document.body.style.overflow = ""; // khôi phục scroll
   document.getElementById("pm-postModal").style.display = "none";
};

// ========== Auto resize textarea ==========
document.addEventListener("input", function (e) {
    if (e.target.classList.contains("pm-input")) {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    }
});


document.addEventListener('DOMContentLoaded', function() {
    initializeModals();
    initializePostForm();
    initializeFileUpload();
    initializeSearchModal();
});

/* =========================
   Modal Tạo Bài Viết
========================= */
function initializeModals() {
    const createPostModal = document.getElementById("create-post-modal");
    const createPostLink = document.getElementById("create-post-link");
    const closeButtons = document.querySelectorAll(".close");

    if (createPostLink && createPostModal) {
        createPostLink.addEventListener("click", function(e) {
            e.preventDefault();
            createPostModal.style.display = "block";
        });
    }

    closeButtons.forEach(button => {
        button.addEventListener("click", function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener("click", function(e) {
        if (e.target.classList.contains("modal")) {
            e.target.style.display = "none";
        }
    });
}

/* =========================
   Submit Form Tạo Bài Viết
========================= */
function initializePostForm() {
    const form = document.getElementById("create-post-form");
    if (!form) return;

    form.addEventListener("submit", async function(e) {
        e.preventDefault();

        const mediaInput = document.getElementById("media");
        const mediaFiles = mediaInput.files;

        if (mediaFiles.length === 0) {
            alert("Bạn phải chọn ít nhất một ảnh hoặc video!");
            return;
        }

        // Validate loại file
        for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                alert("Chỉ chấp nhận file ảnh hoặc video!");
                return;
            }
        }

        const formData = new FormData();
        formData.append("content", form.querySelector('textarea[name="content"]').value);

        for (let i = 0; i < mediaFiles.length; i++) {
            formData.append("media", mediaFiles[i]);
        }

        try {
            const response = await fetch(CREATE_POST_URL, {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRFToken": CSRF_TOKEN
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert("Đăng bài thành công!");
                document.getElementById("create-post-modal").style.display = "none";
                form.reset();
                document.getElementById("preview-container").innerHTML = "";
                document.querySelector(".upload-label p").textContent = "Kéo & thả ảnh/video vào đây";

                // Reload feed
                setTimeout(() => window.location.reload(), 800);
            } else {
                console.error("Lỗi từ server:", data);
                alert(data.error || "Có lỗi xảy ra khi đăng bài");
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            alert("Không thể kết nối đến server");
        }
    });
}

/* =========================
   Preview Ảnh/Video Upload
========================= */
function initializeFileUpload() {
    const mediaInput = document.getElementById("media");
    const previewContainer = document.getElementById("preview-container");
    const uploadLabel = document.querySelector(".upload-label");

    if (!mediaInput || !previewContainer) return;

    mediaInput.addEventListener("change", function(e) {
        previewContainer.innerHTML = "";
        const files = e.target.files;

        if (files.length > 0) {
            uploadLabel.querySelector("p").textContent = `Đã chọn ${files.length} file`;
        } else {
            uploadLabel.querySelector("p").textContent = "Kéo & thả ảnh/video vào đây";
        }

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;

            const reader = new FileReader();
            const previewItem = document.createElement("div");
            previewItem.className = "media-preview";
            previewContainer.appendChild(previewItem);

            reader.onload = function(e) {
                if (file.type.startsWith("image")) {
                    previewItem.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                } else if (file.type.startsWith("video")) {
                    previewItem.innerHTML = `
                        <video controls>
                            <source src="${e.target.result}" type="${file.type}">
                            Trình duyệt không hỗ trợ video
                        </video>
                    `;
                }

                // Nút xóa preview
                const removeBtn = document.createElement("button");
                removeBtn.className = "remove-preview";
                removeBtn.innerHTML = "&times;";
                removeBtn.onclick = function() {
                    previewItem.remove();
                };
                previewItem.appendChild(removeBtn);
            };

            reader.readAsDataURL(file);
        });
    });

    // Drag & Drop
    const uploadBox = document.querySelector(".upload-box");
    if (uploadBox) {
        uploadBox.addEventListener("dragover", function(e) {
            e.preventDefault();
            this.classList.add("dragover");
        });
        uploadBox.addEventListener("dragleave", function() {
            this.classList.remove("dragover");
        });
        uploadBox.addEventListener("drop", function(e) {
            e.preventDefault();
            this.classList.remove("dragover");
            const files = e.dataTransfer.files;
            mediaInput.files = files;
            mediaInput.dispatchEvent(new Event("change"));
        });
    }

    // Nút chọn file
    const selectBtn = document.querySelector(".select-btn");
    if (selectBtn) {
        selectBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            mediaInput.click();
        });
    }
}

/* =========================
   Modal Tìm Kiếm Người Dùng
========================= */
function initializeSearchModal() {
    const searchLink = document.getElementById('search-link');
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    if (!searchLink || !searchModal || !searchInput) return;

    searchLink.addEventListener('click', function(e) {
        e.preventDefault();
        searchModal.style.display = 'block';
        searchInput.focus();
    });

    searchModal.querySelector('.close').addEventListener('click', function() {
        searchModal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === searchModal) searchModal.style.display = 'none';
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') searchModal.style.display = 'none';
    });

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '<p class="search-placeholder">Nhập ít nhất 2 ký tự để tìm kiếm</p>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';

        fetch(`/search-users/?q=${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                if (!data.results || data.results.length === 0) {
                    resultsContainer.innerHTML = '<p class="no-results">Không tìm thấy kết quả nào</p>';
                } else {
                    let html = '';
                    data.results.forEach(user => {
                        html += `
                            <div class="search-result-item">
                                <img src="${user.avatar}" alt="${user.username}" class="avatar">
                                <div class="user-info"><span class="username">${user.username}</span></div>
                                <a href="/profile/${user.username}" class="view-profile-btn">Xem trang cá nhân</a>
                            </div>
                        `;
                    });
                    resultsContainer.innerHTML = html;
                }
            })
            .catch(error => {
                console.error("Search error:", error);
                resultsContainer.innerHTML = '<p class="error">Lỗi khi tìm kiếm</p>';
            });
    });
}
