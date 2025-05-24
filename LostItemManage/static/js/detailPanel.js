// static/js/detailPanel.js

import { updateItem, postComment, deleteItem } from './itemApi.js';

let currentUserId = 0;
export function setUserId(id) { currentUserId = id; }

// 안전 조회 헬퍼
function $id(id) { return document.getElementById(id); }

// 읽기/편집 모드 토글
function toggleEdit(edit) {
  ['detail-title','detail-status','detail-description','detail-date','image-container']
    .forEach(k => $id(k)?.classList.toggle('hidden', edit));
  ['edit-title','edit-description','status-section','save-update','cancel-edit']
    .forEach(k => $id(k)?.classList.toggle('hidden', !edit));
  $id('edit-button')?.classList.toggle('hidden', edit);
  $id('delete-button')?.classList.toggle('hidden', edit);
}

// 댓글 렌더링 (depth 0만 선택 가능)
function renderComments(comments, depth = 0) {
  const list = $id('comment-list');
  if (depth === 0) list.innerHTML = '';
  comments.forEach(c => {
    const div = document.createElement('div');
    div.className = `cursor-pointer hover:bg-gray-100 p-1 rounded ml-${depth * 4}`;
    div.innerHTML = `<strong>${c.user}</strong>: ${c.content}`;
    if (depth === 0) {
      div.onclick = () => {
        $id('parent-comment-id').value = c.id;
        document.querySelectorAll('#comment-list div')
                .forEach(el => el.classList.remove('bg-blue-100'));
        div.classList.add('bg-blue-100');
      };
    }
    list.appendChild(div);
    if (Array.isArray(c.replies) && c.replies.length)
      renderComments(c.replies, depth + 1);
  });
}

export async function showDetail(item) {
  // DOM 요소
  const panel      = $id('lost-item-detail');
  const form       = $id('update-form');
  const editBtn    = $id('edit-button');
  const saveBtn    = $id('save-update');
  const cancelBtn  = $id('cancel-edit');
  const deleteBtn  = $id('delete-button');
  const titleEl    = $id('detail-title');
  const dateEl     = $id('detail-date');
  const statusEl   = $id('detail-status');
  const descEl     = $id('detail-description');
  const imgCont    = $id('image-container');
  const imgEl      = $id('detail-image');
  const editTitle  = $id('edit-title');
  const editDesc   = $id('edit-description');
  const statusSel  = $id('status-select');
  const commentForm = $id('comment-form');
  const parentInput= $id('parent-comment-id');
  const contentInp = $id('comment-content');

  // 1) 초기화
  panel.classList.remove('hidden');
  form.classList.remove('hidden');
  cancelBtn.classList.add('hidden');
  saveBtn.classList.add('hidden');
  deleteBtn.classList.remove('hidden');
  editBtn.classList.remove('hidden');

  // 2) 데이터 바인딩
  titleEl.textContent = item.title;
  // 날짜 포맷: "YYYY-MM-DD hh:mm"
  const dt = new Date(item.created_at);
  console.log(item.created_at);
  dateEl.textContent = dt.toLocaleString();
  statusEl.textContent = item.status;
  descEl.textContent = item.description;

  // 이미지 표시
  if (item.image_url) {
    imgEl.src = item.image_url;
    imgCont.classList.remove('hidden');
  } else {
    imgCont.classList.add('hidden');
  }

  // 수정 폼 값 채우기
  editTitle.value  = item.title;
  editDesc.value   = item.description;
  statusSel.value  = item.status;

  // 3) 권한에 따라 버튼 토글
  if (item.user_id === currentUserId) {
    editBtn.onclick   = () => toggleEdit(true);
    deleteBtn.onclick = async () => {
      if (!confirm('정말 삭제하시겠습니까?')) return;
      await deleteItem(item.id);
      window.location.reload();
    };
  } else {
    deleteBtn.classList.add('hidden');
    editBtn.classList.add('hidden');
  }

  // 4) 저장/취소 핸들러
  form.onsubmit = async e => {
    e.preventDefault();
    const updated = await updateItem(item.id, {
      title:       editTitle.value.trim(),
      description: editDesc.value.trim(),
      status:      statusSel.value
    });
    Object.assign(item, updated);
    toggleEdit(false);
    showDetail(item);
  };
  cancelBtn.onclick = () => {
    toggleEdit(false);
    showDetail(item);
  };

  // 5) 댓글
  parentInput.value = '';
  contentInp.value  = '';
  renderComments(item.comments || []);
  if (commentForm) {
    if (currentUserId) {
      commentForm.classList.remove('hidden');
      commentForm.onsubmit = async ev => {
        ev.preventDefault();
        await postComment(item.id, {
          content: contentInp.value.trim(),
          parent:  parentInput.value ? Number(parentInput.value) : null
        });
        const res    = await fetch(`/item/${item.id}/`);
        const detail = await res.json();
        showDetail(detail);
      };
    } else {
      commentForm.classList.add('hidden');
    }
  }
}
