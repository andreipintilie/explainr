chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'explainr',
    title: 'Explain with AI',
    contexts: ['selection', 'page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'explainr' && tab) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ['content.js'],
      },
      () => {
        setTimeout(() => {
          chrome.tabs
            .sendMessage(tab.id, {
              action: 'showExplanation',
              text: info.selectionText || '',
              noSelection: !info.selectionText,
            })
            .catch((error) => {
              console.log('Content script not ready, retrying...');
              setTimeout(() => {
                chrome.tabs
                  .sendMessage(tab.id, {
                    action: 'showExplanation',
                    text: info.selectionText || '',
                    noSelection: !info.selectionText,
                  })
                  .catch(() => {
                    console.log('Failed to communicate with content script');
                  });
              }, 100);
            });
        }, 50);
      }
    );
  }
});
