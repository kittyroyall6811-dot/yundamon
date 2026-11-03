// 주문 문의 폼: /api/inquiry 로 보낸다. 브라우저에는 키가 하나도 없다.
(() => {
  const form = document.getElementById('order-form');
  if (!form) return;
  const msg = form.querySelector('.form-msg');
  const btn = form.querySelector('button[type="submit"]');

  const show = (text, kind) => {
    msg.textContent = text;
    msg.className = `form-msg ${kind}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    if (!f.name.value.trim() || !f.contact.value.trim()) {
      show('이름과 연락처를 적어 주세요.', 'err');
      (f.name.value.trim() ? f.contact : f.name).focus();
      return;
    }
    if (!f.consent.checked) {
      show('개인정보 수집·이용에 동의해 주세요.', 'err');
      f.consent.focus();
      return;
    }
    btn.disabled = true;
    show('보내는 중이에요…', '');
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name.value,
          contact: f.contact.value,
          message: f.message.value,
          website: f.website.value,
          consent: f.consent.checked,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      show('문의가 접수됐어요. 확인 후 연락드릴게요.', 'ok');
    } catch (err) {
      show(err.message || '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
