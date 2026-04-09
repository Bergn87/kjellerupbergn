(function(w, d) {
  // Hent config fra script-tag
  var s = d.currentScript;
  var tenant = s.getAttribute('data-tenant');
  var calculator = s.getAttribute('data-calculator') || '';
  var color = s.getAttribute('data-color') || '';

  if (!tenant) {
    console.warn('[Bergn] data-tenant mangler');
    return;
  }

  var container = d.getElementById('bergn') || d.getElementById('bergn-calculator');
  if (!container) {
    console.warn('[Bergn] <div id="bergn"> eller <div id="bergn-calculator"> ikke fundet');
    return;
  }

  // Byg src URL
  var base = s.getAttribute('data-url') || 'https://app.bergn.dk';
  var path = '/embed/' + tenant + (calculator ? '/' + calculator : '');
  var params = color ? '?color=' + encodeURIComponent(color) : '';

  // Opret iframe
  var iframe = d.createElement('iframe');
  iframe.src = base + path + params;
  iframe.title = 'Prisberegner';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.style.cssText = [
    'width:100%',
    'border:none',
    'min-height:520px',
    'display:block',
    'transition:height 0.2s ease'
  ].join(';');

  container.appendChild(iframe);

  // Auto-resize via postMessage
  w.addEventListener('message', function(e) {
    if (!e.data || e.data.source !== 'bergn') return;

    if (e.data.type === 'resize') {
      iframe.style.height = (e.data.height + 20) + 'px';
    }

    if (e.data.type === 'lead-submitted') {
      // Dispatch custom event så hosting-siten kan lytte
      d.dispatchEvent(new CustomEvent('bergn:lead', {
        detail: e.data.payload
      }));
    }
  });

  // Public API
  w.Bergn = {
    reset: function() {
      iframe.contentWindow.postMessage({ source: 'bergn-host', type: 'reset' }, '*');
    }
  };
})(window, document);
