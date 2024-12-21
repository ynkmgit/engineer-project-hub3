import { SCROLL_DEBOUNCE_TIME } from '../constants';

export const getScrollSyncScript = () => `
  let isScrolling = false;
  let lastKnownScrollPosition = 0;
  let ticking = false;

  document.addEventListener('scroll', function(e) {
    if (!isScrolling) {
      lastKnownScrollPosition = window.scrollY;
      
      if (!ticking) {
        window.requestAnimationFrame(function() {
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          
          if (maxScroll > 0) {
            const percentage = lastKnownScrollPosition / maxScroll;
            window.parent.postMessage({
              type: 'scroll',
              scrollInfo: {
                scrollTop: lastKnownScrollPosition,
                scrollHeight: scrollHeight,
                height: clientHeight,
                percentage: percentage
              }
            }, '*');
          }
          ticking = false;
        });
        ticking = true;
      }
    }
  }, { passive: true });

  function setScrollPosition(percentage) {
    if (!isScrolling) {
      isScrolling = true;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      const scrollTop = percentage * maxScroll;
      
      window.scrollTo({
        top: scrollTop,
        behavior: 'instant'
      });

      setTimeout(() => {
        isScrolling = false;
      }, ${SCROLL_DEBOUNCE_TIME});
    }
  }

  window.addEventListener('message', function(event) {
    if (event.data.type === 'setScrollPosition') {
      setScrollPosition(event.data.percentage);
    } else if (event.data.type === 'toggleSelectionMode') {
      if (event.data.isSelectionMode) {
        document.body.classList.add('selection-mode');
      } else {
        document.body.classList.remove('selection-mode');
      }
    }
  });
`;

export const getMermaidInitScript = () => `
  let mermaidInitialized = false;
  let isInSelectionMode = false;

  function initializeMermaid() {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'sans-serif'
      });
      mermaidInitialized = true;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeMermaid();
    const mermaidDivs = document.querySelectorAll('.mermaid');
    
    mermaidDivs.forEach(async (div, index) => {
      try {
        const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        const diagramText = div.textContent.trim();
        const { svg } = await mermaid.render(id, diagramText);
        div.innerHTML = svg;
      } catch (error) {
        console.error('Error rendering mermaid:', error);
        div.innerHTML = '<pre>Error rendering diagram: ' + error.message + '</pre>';
      }
    });
  });
`;

export const getElementSelectionScript = () => `
  document.addEventListener('click', function(e) {
    if (isInSelectionMode) {
      e.preventDefault();
      e.stopPropagation();

      let element = e.target;
      let path = [];
      let cssProperties = {};

      const computedStyle = window.getComputedStyle(element);
      const properties = ['color', 'background-color', 'font-weight', 'margin-top', 'margin-right', 
        'margin-bottom', 'margin-left', 'padding', 'border-radius', 'text-align', 'position', 'display'];
      
      properties.forEach(prop => {
        cssProperties[prop] = computedStyle.getPropertyValue(prop);
      });

      while (element && element.tagName !== 'BODY') {
        let selector = element.tagName.toLowerCase();
        if (element.id) {
          selector += '#' + element.id;
        } else if (element.className) {
          const classes = Array.from(element.classList)
            .filter(className => className !== 'selection-mode')
            .join('.');
          if (classes) {
            selector += '.' + classes;
          }
        }
        path.unshift(selector);
        element = element.parentElement;
      }

      window.parent.postMessage({
        type: 'elementSelected',
        path: path.join(' > '),
        tagName: e.target.tagName.toLowerCase(),
        id: e.target.id,
        className: e.target.className,
        cssProperties: cssProperties
      }, '*');
    }
  }, true);

  window.addEventListener('message', function(event) {
    if (event.data.type === 'setScrollPosition') {
      setScrollPosition(event.data.percentage);
    } else if (event.data.type === 'toggleSelectionMode') {
      isInSelectionMode = event.data.isSelectionMode;
      if (isInSelectionMode) {
        document.body.classList.add('selection-mode');
      } else {
        document.body.classList.remove('selection-mode');
      }
    }
  });
`;