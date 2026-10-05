/*
 * Aplica as preferências salvas antes da primeira pintura (tema, idioma,
 * tamanho da letra e movimento), evitando o "flash" de aparência. Sem
 * escolha salva: tema escuro, português, letra média e movimento conforme
 * o sistema. Arquivo externo (e não inline) para permitir uma Content
 * Security Policy sem 'unsafe-inline' em scripts.
 *
 * Deve casar com `src/hooks/usePreferencias.tsx`.
 */
(function () {
  var raiz = document.documentElement;
  var p = {};
  try {
    p = JSON.parse(localStorage.getItem('rapi-preferencias') || '{}') || {};
    // Compatibilidade com a chave antiga, só de tema.
    if (!p.tema && localStorage.getItem('rapi-tema') === 'light') p.tema = 'light';
  } catch (e) {
    /* storage indisponível: segue com os padrões. */
  }

  var reduzir =
    typeof p.reduzirMovimento === 'boolean'
      ? p.reduzirMovimento
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  raiz.classList.toggle('dark', p.tema !== 'light');
  raiz.lang = p.idioma === 'en' ? 'en' : 'pt-BR';
  raiz.dataset.fonte = p.fonte === 'p' || p.fonte === 'g' ? p.fonte : 'm';
  raiz.dataset.movimento = reduzir ? 'reduzido' : 'normal';
})();
