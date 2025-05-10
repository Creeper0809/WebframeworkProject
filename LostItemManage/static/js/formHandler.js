export function initForm(currentUserId) {
  const form = document.getElementById('lost-item-form');
  if (!form) return;

  form.onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.user_id = currentUserId;
    const item = await fetch('/item/', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
    }).then(r=>r.json());

    // 마커 생성 & 상세 표시
    if(window.createMarker) createMarker(item);
    if(window.showDetail) showDetail(item);

    form.reset();
    form.classList.add('hidden');
  };
}