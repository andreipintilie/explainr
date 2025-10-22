chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'nano-assistant',
    title: 'Explain with AI',
    contexts: ['selection', 'page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'nano-assistant' && tab) {
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
              setTimeout(() => {
                chrome.tabs
                  .sendMessage(tab.id, {
                    action: 'showExplanation',
                    text: info.selectionText || '',
                    noSelection: !info.selectionText,
                  })
                  .catch(() => {});
              }, 100);
            });
        }, 50);
      }
    );
  }
});
