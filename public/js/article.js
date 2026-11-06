// ==========================================================================
// Article Client Controller (VnExpress Style Article & Embedded Match Widget)
// ==========================================================================

const state = {
  article: null,
  slug: '',
  id: '',
  isPlayingAudio: false
};

// Parse URL pathname to extract slug and id: /slug-id.html
function parseArticleUrl() {
  const pathname = window.location.pathname;
  const match = pathname.match(/\/([a-zA-Z0-9_-]+)-(\d+)\.html$/);
  if (match) {
    return {
      slug: match[1],
      id: match[2]
    };
  }
  return {
    slug: 'liverpool-thang-chelsea-luan-luu-o-cup-lien-doan',
    id: '5138105'
  };
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Convert vnexpress URL to local app article URL
function getArticleUrl(link) {
  if (!link) return '#';
  try {
    const clean = link.split('?')[0].split('#')[0];
    const match = clean.match(/\/([a-zA-Z0-9_-]+-\d+\.html)$/);
    if (match) {
      return '/' + match[1];
    }
  } catch (e) {}
  return link;
}

// Initialize Article Page
async function initArticlePage() {
  const urlData = parseArticleUrl();
  state.slug = urlData.slug;
  state.id = urlData.id;

  try {
    const res = await fetch(`/api/article?slug=${encodeURIComponent(state.slug)}&id=${encodeURIComponent(state.id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.article = data;

    renderArticle(data);
  } catch (err) {
    console.error('Error loading article:', err);
    document.getElementById('article-title').innerText = 'Không thể tải nội dung bài viết';
    document.getElementById('article-body').innerHTML = `
      <p class="Normal" style="color: var(--vds-text-negative-regular);">
        Có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng thử lại sau hoặc quay lại <a href="/">Trang chủ</a>.
      </p>
    `;
  }
}

// Render Article Components
function renderArticle(data) {
  // 1. Page Title
  document.title = `${data.title} - Thể thao VnExpress`;

  // 2. Breadcrumb
  const crumbLeague = document.getElementById('crumb-league');
  if (crumbLeague && data.league) {
    crumbLeague.innerHTML = `<a href="/giai-dau/${data.league.slug}">${data.league.vnName || data.league.name}</a>`;
  }

  // 3. Publish Date
  const dateEl = document.getElementById('article-date');
  if (dateEl) {
    dateEl.innerText = data.date || 'Thứ năm, 29/10/2026, 06:39 (GMT+7)';
  }

  // 4. Headline H1
  const titleEl = document.getElementById('article-title');
  if (titleEl) {
    titleEl.innerText = data.title;
  }

  // 5. Lead Paragraph
  const leadEl = document.getElementById('article-lead');
  if (leadEl) {
    leadEl.innerHTML = data.lead || '';
  }

  // 6. Article Body (Free of ads)
  const bodyEl = document.getElementById('article-body');
  if (bodyEl) {
    bodyEl.innerHTML = data.body || '';
  }

  // 7. Author Signature
  const authorEl = document.getElementById('article-author');
  if (authorEl && data.author) {
    authorEl.innerHTML = `<strong>${data.author}</strong>`;
  }

  // 8. Embedded Match Widget (100% Identical to Image 2 + User Navigations)
  renderEmbeddedMatchWidget(data.widget, data.league);

  // 9. Tags / Topics
  renderTags(data.tags);

  // 10. Sidebar Data
  renderSidebar(data);

  // 11. Related Articles Grid
  renderRelatedNews(data.relatedNews);

  // 12. Comments
  renderComments(data);
}

// Render Embedded Match Widget
function renderEmbeddedMatchWidget(widget, league) {
  if (!widget) return;

  const titleEl = document.getElementById('ew-title');
  if (titleEl) {
    titleEl.innerText = widget.title || `Lịch đấu – Kết quả ${league?.vnName || 'Ngoại hạng Anh'}`;
  }

  const dateEl = document.getElementById('ew-date-row');
  if (dateEl) {
    dateEl.innerText = widget.dateTitle || 'Thứ bảy, ngày 31/10/2026';
  }

  const listEl = document.getElementById('ew-match-list');
  if (listEl && widget.matches && widget.matches.length > 0) {
    listEl.innerHTML = widget.matches.map(m => `
      <a href="/tran-dau/${m.matchSlug}" class="vne-ew-match-row" title="Xem chi tiết trận đấu ${m.homeTeam} vs ${m.awayTeam}">
        <span class="vne-ew-round">${m.round}</span>
        <div class="vne-ew-match-info">
          <span class="vne-ew-team-home">${m.homeTeam}</span>
          <img src="${m.homeLogo}" alt="${m.homeTeam}" class="vne-ew-team-logo" loading="lazy" onerror="this.src='https://is.vnecdn.net/objects/teams/40.png?v=1'">
          <span class="vne-ew-score-time ${m.isLive ? 'is-live' : ''}">${m.timeOrScore}</span>
          <img src="${m.awayLogo}" alt="${m.awayTeam}" class="vne-ew-team-logo" loading="lazy" onerror="this.src='https://is.vnecdn.net/objects/teams/40.png?v=1'">
          <span class="vne-ew-team-away">${m.awayTeam}</span>
        </div>
        <span class="vne-ew-arrow" aria-hidden="true">&rsaquo;</span>
      </a>
    `).join('');
  }

  // 2 Navigation Buttons (User requirement: no 'Xem tất cả', add Kết quả & Lịch thi đấu)
  const btnResults = document.getElementById('ew-btn-results');
  if (btnResults) {
    btnResults.href = widget.resultsUrl || `/giai-dau/${league?.slug || 'ngoai-hang-anh'}/ket-qua`;
  }

  const btnFixtures = document.getElementById('ew-btn-fixtures');
  if (btnFixtures) {
    btnFixtures.href = widget.fixturesUrl || `/giai-dau/${league?.slug || 'ngoai-hang-anh'}/lich-thi-dau`;
  }
}

// Render Tags
function renderTags(tags) {
  const container = document.getElementById('article-tags-list');
  const wrap = document.getElementById('article-tags-wrap');
  if (!container || !wrap) return;

  if (!tags || tags.length === 0) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = 'block';
  container.innerHTML = tags.map(tag => `
    <a href="/?q=${encodeURIComponent(tag)}" class="vne-tag-pill">${escapeHtml(tag)}</a>
  `).join('');
}

// Render Sidebar
function renderSidebar(data) {
  // 1. Most Viewed ("Xem nhiều")
  const mvContainer = document.getElementById('sidebar-most-viewed');
  if (mvContainer && data.mostViewed) {
    mvContainer.innerHTML = data.mostViewed.map((item, idx) => `
      <a href="${getArticleUrl(item.link)}" class="vne-most-viewed-item">
        <span class="vne-mv-num">${idx + 1}</span>
        <h4 class="vne-mv-title">${escapeHtml(item.title)}</h4>
      </a>
    `).join('');
  }

  // 2. Latest News ("Tin mới nhận")
  const latestContainer = document.getElementById('sidebar-latest-news');
  if (latestContainer && data.mostViewed) {
    latestContainer.innerHTML = data.mostViewed.slice(0, 4).map(item => `
      <a href="${getArticleUrl(item.link)}" class="vne-latest-item">
        <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}" class="vne-latest-thumb" loading="lazy" onerror="this.src='https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png'">
        <div class="vne-latest-content">
          <h4 class="vne-latest-title">${escapeHtml(item.title)}</h4>
          <span class="vne-latest-time">${item.timeAgo || 'Vừa xong'}</span>
        </div>
      </a>
    `).join('');
  }

  // 3. League Nav Box
  const lLogo = document.getElementById('slb-logo');
  const lName = document.getElementById('slb-name');
  const linkRes = document.getElementById('slb-link-results');
  const linkFix = document.getElementById('slb-link-fixtures');
  const linkStd = document.getElementById('slb-link-standings');

  if (data.league) {
    if (lLogo) lLogo.src = data.league.logo || 'https://is.vnecdn.net/objects/leagues/39.png?v=1';
    if (lName) lName.innerText = data.league.vnName || data.league.name;
    if (linkRes) linkRes.href = `/giai-dau/${data.league.slug}/ket-qua`;
    if (linkFix) linkFix.href = `/giai-dau/${data.league.slug}/lich-thi-dau`;
    if (linkStd) linkStd.href = `/giai-dau/${data.league.slug}/bang-xep-hang`;
  }
}

// Render Related News
function renderRelatedNews(relatedNews) {
  const container = document.getElementById('article-related-grid');
  if (!container || !relatedNews) return;

  container.innerHTML = relatedNews.map(item => `
    <a href="${getArticleUrl(item.link)}" class="vne-related-card">
      <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}" class="vne-related-thumb" loading="lazy" onerror="this.src='https://s1.vnecdn.net/vnexpress/restruct/i/v9525/v2_2019/pc/graphics/placeholder.png'">
      <div class="vne-related-content">
        <h4 class="vne-related-heading">${escapeHtml(item.title)}</h4>
        <span class="vne-related-time">${item.timeAgo || 'Gần đây'}</span>
      </div>
    </a>
  `).join('');
}

// Initial Comments Data
const sampleComments = [
  {
    name: 'Hoàng Minh',
    time: '25 phút trước',
    text: 'Trận đấu kịch tính đến tận những loạt luân lưu cuối cùng. Liverpool bản lĩnh hơn ở chấm 11m, xin chúc mừng The Kop!',
    likes: 42
  },
  {
    name: 'Tuấn Chelsea',
    time: '45 phút trước',
    text: 'Chelsea chơi rất quả cảm và tạo ra nhiều cơ hội rõ nét trong 90 phút. Dù thua luân lưu nhưng lối chơi dưới thời HLV mới đang dần khởi sắc.',
    likes: 29
  },
  {
    name: 'Quang Hải Fan',
    time: '1 giờ trước',
    text: 'Loạt luân lưu quá hồi hộp, thủ môn hai bên đều chơi xuất sắc. Bán kết năm nay chắc chắn sẽ rất hấp dẫn.',
    likes: 15
  }
];

function renderComments(data) {
  const container = document.getElementById('article-comments-list');
  if (!container) return;

  const total = sampleComments.length;
  const countEl = document.getElementById('comments-total');
  const badgeEl = document.getElementById('social-comment-count');
  if (countEl) countEl.innerText = total;
  if (badgeEl) badgeEl.innerText = total;

  container.innerHTML = sampleComments.map((c, i) => `
    <div class="vne-comment-item" id="comment-item-${i}">
      <div class="vne-comment-item-header">
        <span class="vne-comment-user">${escapeHtml(c.name)}</span>
        <span class="vne-comment-time">• ${c.time}</span>
      </div>
      <div class="vne-comment-text">${escapeHtml(c.text)}</div>
      <div class="vne-comment-actions">
        <button class="vne-comment-like-btn" onclick="likeComment(${i})">👍 Thích (<span id="like-cnt-${i}">${c.likes}</span>)</button>
        <button class="vne-comment-reply-btn" onclick="replyComment('${c.name}')">Trả lời</button>
      </div>
    </div>
  `).join('');
}

// Post New Comment
function postComment() {
  const input = document.getElementById('user-comment-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    alert('Vui lòng nhập nội dung bình luận của bạn.');
    input.focus();
    return;
  }

  const newComment = {
    name: 'Bạn đọc',
    time: 'Vừa xong',
    text: text,
    likes: 1
  };

  sampleComments.unshift(newComment);
  input.value = '';
  renderComments(state.article);

  // Smooth scroll to top of comments
  const list = document.getElementById('article-comments-list');
  if (list) {
    list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Like Comment
function likeComment(idx) {
  if (sampleComments[idx]) {
    sampleComments[idx].likes += 1;
    const cntEl = document.getElementById(`like-cnt-${idx}`);
    if (cntEl) cntEl.innerText = sampleComments[idx].likes;
  }
}

// Reply Comment
function replyComment(userName) {
  const input = document.getElementById('user-comment-input');
  if (input) {
    input.value = `@${userName}: `;
    input.focus();
  }
}

// Copy URL to clipboard
function copyArticleUrl() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
  }).catch(() => {
    prompt('Sao chép đường dẫn dưới đây:', window.location.href);
  });
}

// Share Facebook
function shareFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

// Toggle Audio Reading
function toggleAudioReading() {
  const label = document.getElementById('audio-btn-label');
  if (!label) return;

  if (!state.isPlayingAudio) {
    state.isPlayingAudio = true;
    label.innerText = 'Đang đọc báo... ⏹ Dừng';
    if ('speechSynthesis' in window) {
      const lead = document.getElementById('article-lead')?.innerText || '';
      const title = document.getElementById('article-title')?.innerText || '';
      const text = `${title}. ${lead}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.onend = () => {
        state.isPlayingAudio = false;
        label.innerText = 'Nghe đọc báo';
      };
      window.speechSynthesis.speak(utterance);
    }
  } else {
    state.isPlayingAudio = false;
    label.innerText = 'Nghe đọc báo';
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', initArticlePage);
