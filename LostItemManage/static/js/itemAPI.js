// API 호출 래퍼
export async function getItems() {
  const res = await fetch('/item/');
  return res.json();
}

export async function updateItem(id, data) {
  const res = await fetch(`/item/${id}/`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function postComment(itemId, payload) {
  const res = await fetch(`/item/${itemId}/comment/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  return res.json();
}