export function initForm(userId) {
  const form = document.getElementById('lost-item-form');
  console.log(form);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    try {
      const res = await fetch('/item/', {
        method: 'POST',
        headers: { 'X-CSRFToken': formData.get('csrfmiddlewaretoken') },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '등록에 실패했습니다.');
        return;
      }

      alert('유실물이 등록되었습니다!');

      form.reset();
      form.classList.add('hidden');

      window.location.reload();

    } catch (err) {
      console.error(err);
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  });
}
