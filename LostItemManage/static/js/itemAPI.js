// static/js/itemApi.js

/**
 * 전체 리스트 조회
 * @returns {Promise<Array>} LostItem 목록
 */
export async function getItems() {
  const res = await fetch('/item/');
  if (!res.ok) throw new Error(`getItems failed: ${res.status}`);
  return res.json();
}

/**
 * 단일 아이템 상세 조회
 * @param {number} id
 * @returns {Promise<Object>} LostItem 객체
 */
export async function getItem(id) {
  const res = await fetch(`/item/${id}/`);
  if (!res.ok) throw new Error(`getItem(${id}) failed: ${res.status}`);
  return res.json();
}

/**
 * 아이템 정보 수정
 * @param {number} id
 * @param {Object} data { title, description, status }
 * @returns {Promise<Object>} 업데이트된 필드
 */
export async function updateItem(id, data) {
  const res = await fetch(`/item/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`updateItem(${id}) failed: ${res.status}`);
  return res.json();
}

/**
 * 아이템 삭제
 * @param {number} id
 * @returns {Promise<Object>} { message: 'Item deleted' }
 */
export async function deleteItem(id) {
  const res = await fetch(`/item/${id}/`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`deleteItem(${id}) failed: ${res.status}`);
  return res.json();
}

/**
 * 댓글 등록
 * @param {number} itemId
 * @param {{content: string, parent: number|null}} payload
 * @returns {Promise<Object>} 생성된 Comment 데이터
 */
export async function postComment(itemId, payload) {
  const res = await fetch(`/item/${itemId}/comment/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`postComment(${itemId}) failed: ${res.status}`);
  return res.json();
}
