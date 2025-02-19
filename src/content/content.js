let port;

function connectToBackground() {
  port = chrome.runtime.connect({ name: 'keyCommandPort' });
  
  port.onDisconnect.addListener(() => {
    setTimeout(connectToBackground, 1000);
  });
}

function handleKeyEvent(event) {
  if (!port) return;
  
  const isInputField = event.target.tagName === 'INPUT' || 
                      event.target.tagName === 'TEXTAREA' || 
                      event.target.contentEditable === 'true';
  
  if (isInputField) return;
  
  const keyData = {
    key: event.key.toLowerCase(),
    type: event.type,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey
  };
  
  port.postMessage({
    type: 'keyEvent',
    event: keyData,
    tab: { url: window.location.href }
  });
}

function init() {
  connectToBackground();
  
  document.addEventListener('keydown', handleKeyEvent, true);
  document.addEventListener('keyup', handleKeyEvent, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}