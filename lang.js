// const languageSwitcher = document.getElementById('languageSwitcher');
// const elementsToTranslate = document.querySelectorAll('[data-i18n]');

// function loadLanguage(lang) {
//   fetch(`/Документи/papka/lang/${lang}.json`)
//     .then(res => res.json())
//     .then(translations => {
//       elementsToTranslate.forEach(el => {
//         const key = el.getAttribute('data-i18n');
//         if (translations[key]) {
//           el.textContent = translations[key];
//         }
//       });
//     });
// }

// function initLanguage() {
//   const savedLang = localStorage.getItem('lang') || 'en';
//   languageSwitcher.value = savedLang;
//   loadLanguage(savedLang);
// }

// languageSwitcher.addEventListener('change', (e) => {
//   const selectedLang = e.target.value;
//   localStorage.setItem('lang', selectedLang);
//   loadLanguage(selectedLang);
// });

// document.addEventListener('DOMContentLoaded', initLanguage);
document.addEventListener('DOMContentLoaded', () => {
  const languageSwitcher = document.getElementById('languageSwitcher');
  const elementsToTranslate = document.querySelectorAll('[data-i18n]');

  function loadLanguage(lang) {
    fetch(`/Документи/papka/lang/${lang}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Помилка завантаження JSON');
        return res.json();
      })
      .then(translations => {
        elementsToTranslate.forEach(el => {
          const key = el.getAttribute('data-i18n');
          if (translations[key]) {
            el.textContent = translations[key];
          }
        });
      })
      .catch(err => {
        console.error('Помилка завантаження мови:', err);
      });
  }

  // 1. Визначаємо мову (з localStorage або ua)
  const currentLang = localStorage.getItem('lang') || 'en';
  loadLanguage(currentLang);

  // 2. Якщо є селектор — синхронізуємо
  if (languageSwitcher) {
    languageSwitcher.value = currentLang;

    languageSwitcher.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem('lang', selectedLang);
      loadLanguage(selectedLang);
    });
  }
});
