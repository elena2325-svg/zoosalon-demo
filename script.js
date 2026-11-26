// Мобильное меню
const header = document.querySelector('.header');
document.querySelector('.burger')?.addEventListener('click', () => header.classList.toggle('open'));

// Плавное появление блоков при прокрутке
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Лайтбокс для фото
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = '<button class="lightbox__close" aria-label="Закрыть">×</button><img alt="">';
document.body.appendChild(lightbox);
const lbImg = lightbox.querySelector('img');
document.querySelectorAll('[data-zoom]').forEach((img) => {
  img.addEventListener('click', () => { lbImg.src = img.src; lbImg.alt = img.alt; lightbox.classList.add('open'); });
});
lightbox.addEventListener('click', (e) => { if (e.target !== lbImg) lightbox.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('open'); });

// Фильтры галереи
document.querySelectorAll('.filter[data-filter]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter[data-filter]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.gallery__item').forEach((item) => {
      item.style.display = f === 'all' || item.dataset.cat === f ? '' : 'none';
    });
  });
});

// Форма записи: собирает заявку и копирует её. Внешний контакт заменён заглушкой.
document.querySelector('#booking')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const d = new FormData(form);
  const error = form.querySelector('.form__error');
  if (!d.get('name').trim() || !d.get('phone').trim() || !d.get('pet').trim()) {
    error.hidden = false;
    return;
  }
  error.hidden = true;
  const text = [
    'Здравствуйте! Хочу записаться на груминг.',
    `Имя: ${d.get('name')}`,
    `Телефон: ${d.get('phone')}`,
    `Салон: ${d.get('salon')}`,
    `Услуга: ${d.get('service')}`,
    `Питомец: ${d.get('pet')}`,
    `Удобное время: ${d.get('time') || 'любое'}`,
    `Комментарий: ${d.get('comment') || 'нет'}`,
  ].join('\n');
  const result = form.querySelector('#f-result');
  result.value = text;
  form.querySelector('.form__ok').hidden = false;
  const copy = navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject();
  copy.catch(() => { result.select(); document.execCommand('copy'); });
});

// Вкладки прайса
document.querySelectorAll('.filter[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter[data-tab]').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.price-group').forEach((g) => g.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Карусель отзывов
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const viewport = carousel.querySelector('[data-carousel-viewport]');
  const track = carousel.querySelector('[data-carousel-track]');
  if (!viewport || !track) return;
  const items = Array.from(track.children);
  if (items.length < 2) return;

  carousel.classList.add('is-enhanced');
  const controls = document.createElement('div');
  controls.className = 'carousel__controls';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel__btn';
  prev.setAttribute('aria-label', 'Предыдущие отзывы');
  prev.textContent = '‹';
  const dots = document.createElement('div');
  dots.className = 'carousel__dots';
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel__btn';
  next.setAttribute('aria-label', 'Следующие отзывы');
  next.textContent = '›';
  controls.append(prev, dots, next);
  carousel.appendChild(controls);

  let page = 0;
  const getPerView = () => (window.innerWidth <= 600 ? 1 : window.innerWidth <= 900 ? 2 : 3);
  const getPageCount = () => Math.ceil(items.length / getPerView());
  const getGap = () => {
    const gap = parseFloat(getComputedStyle(track).gap);
    return Number.isFinite(gap) ? gap : 24;
  };
  const buildDots = () => {
    dots.innerHTML = '';
    for (let i = 0; i < getPageCount(); i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Показать страницу отзывов ${i + 1}`);
      dot.addEventListener('click', () => { page = i; update(); });
      dots.appendChild(dot);
    }
  };
  const update = () => {
    const perView = getPerView();
    carousel.style.setProperty('--per-view', perView);
    const pageCount = getPageCount();
    if (page > pageCount - 1) page = pageCount - 1;
    track.style.transform = `translateX(${-page * (viewport.clientWidth + getGap())}px)`;
    prev.disabled = page === 0;
    next.disabled = page === pageCount - 1;
    Array.from(dots.children).forEach((dot, index) => dot.classList.toggle('active', index === page));
  };

  prev.addEventListener('click', () => { if (page > 0) { page -= 1; update(); } });
  next.addEventListener('click', () => { if (page < getPageCount() - 1) { page += 1; update(); } });
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
  });

  let currentPerView = getPerView();
  window.addEventListener('resize', () => {
    if (getPerView() !== currentPerView) {
      currentPerView = getPerView();
      buildDots();
    }
    update();
  });

  buildDots();
  update();
});

// Оживление фото в hero: мягкий наклон за курсором
(() => {
  const heroPhotos = document.querySelector('.hero__photos');
  if (!heroPhotos) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const imgs = heroPhotos.querySelectorAll('img');

  if (finePointer) {
    heroPhotos.addEventListener('pointerenter', () => heroPhotos.classList.add('is-hovering'));
    heroPhotos.addEventListener('pointerleave', () => heroPhotos.classList.remove('is-hovering'));

    imgs.forEach((img) => {
      img.addEventListener('pointermove', (e) => {
        const rect = img.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        img.classList.add('is-alive');
        img.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-6px) scale(1.03)`;
      });
      img.addEventListener('pointerleave', () => {
        img.classList.remove('is-alive');
        img.style.transform = '';
      });
    });
  } else {
    // Тач: короткое «оживление» по касанию
    let touchTimer;
    imgs.forEach((img) => {
      img.addEventListener('pointerdown', () => {
        clearTimeout(touchTimer);
        img.classList.add('is-alive');
        img.style.transform = 'translateY(-6px) scale(1.03)';
        touchTimer = setTimeout(() => {
          img.classList.remove('is-alive');
          img.style.transform = '';
        }, 700);
      });
    });
  }
})();
