import { updateItem, postComment } from './itemApi.js';

let currentUserId = 0;
export function setUserId(id) { currentUserId = id; }

// 안전 조회 헬퍼
function $id(id) { return document.getElementById(id); }

// 읽기/편집 모드 토글
function toggleEdit(edit) {
  ['detail-title','detail-status','detail-description'].forEach(k => $id(k)?.classList.toggle('hidden', edit));
  ['edit-title','edit-description','status-section','edit-buttons'].forEach(k => $id(k)?.classList.toggle('hidden', !edit));
  $id('edit-button')?.classList.toggle('hidden', true);
}

// 댓글 렌더링 (최상위 댓글만 클릭 가능)
function renderComments(comments, depth = 0) {
  const list = $id('comment-list');
  if (!list) return;
  if (depth === 0) list.innerHTML = '';

  comments.forEach(c => {
    const div = document.createElement('div');
    div.className = `cursor-pointer hover:bg-gray-100 p-1 rounded ml-${depth * 4}`;
    div.innerHTML = `<strong>${c.user}</strong>: ${c.content}`;
    // 최상위 댓글(depth 0)만 클릭 이벤트 등록
    if (depth === 0) {
      div.addEventListener('click', () => {
        $id('parent-comment-id').value = c.id;
        document.querySelectorAll('#comment-list div').forEach(el => el.classList.remove('bg-blue-100'));
        div.classList.add('bg-blue-100');
      });
    }
    list.appendChild(div);
    // 대댓글 렌더링 재귀 호출 (depth+1)
    if (Array.isArray(c.replies) && c.replies.length > 0) {
      renderComments(c.replies, depth + 1);
    }
  });
}

export async function showDetail(item) {
  const titleEl = $id('detail-title');
  if (!titleEl) return;

  const commentForm = $id('comment-form');
  const parentInput = $id('parent-comment-id');
  const contentInput = $id('comment-content');

  // 이전 선택 및 입력 초기화
  if (parentInput) parentInput.value = '';
  document.querySelectorAll('#comment-list div').forEach(el => el.classList.remove('bg-blue-100'));
  if (contentInput) contentInput.value = '';

  const statusEl = $id('detail-status');
  const descEl = $id('detail-description');
  const editTitle = $id('edit-title');
  const editDesc = $id('edit-description');
  const statusSelect = $id('status-select');
  const updateForm = $id('update-form');
  const editBtn = $id('edit-button');
  const cancelBtn = $id('cancel-edit');

  // 읽기 모드 초기화
  ['detail-title','detail-status','detail-description'].forEach(k => $id(k)?.classList.remove('hidden'));
  ['edit-title','edit-description','status-section','edit-buttons','edit-button'].forEach(k => $id(k)?.classList.add('hidden'));

  // 데이터 바인딩
  $id('detail-title').textContent = item.title;
  statusEl.textContent = `상태: ${item.status}`;
  descEl.textContent = item.description;
  editTitle.value = item.title;
  editDesc.value = item.description;
  statusSelect.value = item.status;

  // 편집 버튼 설정
  if (item.user_id === currentUserId) {
    editBtn.classList.remove('hidden');
    editBtn.onclick = () => toggleEdit(true);
    cancelBtn.onclick = () => toggleEdit(false);
  } else {
    editBtn.classList.add('hidden');
  }

  // 패널 표시
  $id('lost-item-detail')?.classList.remove('hidden');
  $id('lost-item-form')?.classList.add('hidden');

  // 수정 폼 처리
  updateForm.onsubmit = async e => {
    e.preventDefault();
    const updated = await updateItem(item.id, {
      title: editTitle.value.trim(),
      description: editDesc.value.trim(),
      status: statusSelect.value
    });
    Object.assign(item, updated);
    showDetail(item);
  };

  // 댓글 렌더링
  renderComments(item.comments || []);

  // 댓글 작성 핸들러: 서버에서 댓글 포함된 최신 데이터 로드
  if (commentForm) {
    if (currentUserId) {
      commentForm.classList.remove('hidden');
      commentForm.onsubmit = async e => {
        e.preventDefault();
        const content = contentInput.value.trim();
        const parentVal = parentInput.value;
        await postComment(item.id, {
          content,
          parent: parentVal ? parseInt(parentVal, 10) : null
        });
        // 댓글 등록 후 서버에서 다시 불러오기
        const res = await fetch(`/item/${item.id}/`);
        const detail = await res.json();
        showDetail(detail);
      };
    } else {
      commentForm.classList.add('hidden');
    }
  }
}
