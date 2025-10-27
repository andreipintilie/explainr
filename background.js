chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'nano-assistant' && tab) {
    handleExplainAction(info, tab);
  } else if (info.menuItemId === 'nano-assistant-rephrase' && tab) {
    handleRephraseAction(info, tab);
  }
});

function createContextMenus() {
  chrome.contextMenus.create({
    id: 'nano-assistant',
    title: 'Explain with AI',
    contexts: ['selection', 'page'],
  });

  chrome.contextMenus.create({
    id: 'nano-assistant-rephrase',
    title: 'Rephrase with AI',
    contexts: ['selection'],
  });
}

function handleExplainAction(info, tab) {
  injectContentScript(tab.id, () => {
    sendMessageWithRetry(tab.id, {
      action: 'showExplanation',
      text: info.selectionText || '',
      noSelection: !info.selectionText,
    });
  });
}

function handleRephraseAction(info, tab) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: getSelectionInfo,
    },
    (results) => {
      const selectionInfo = results?.[0]?.result;

      injectContentScript(tab.id, () => {
        sendRephraseMessage(tab.id, info.selectionText, selectionInfo);
      });
    }
  );
}

function getSelectionInfo() {
  const selection = window.getSelection();
  const activeElement = document.activeElement;

  const selectionInfo = {
    text: selection.toString(),
    hasRange: selection.rangeCount > 0,
    range: null,
    element: null,
    startOffset: null,
    endOffset: null,
    isContentEditable: false,
    parentElement: null,
    activeElement: null,
  };

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    selectionInfo.range = {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
      commonAncestorContainer: range.commonAncestorContainer,
      htmlContent: range.cloneContents().textContent,
      surroundingText: range.commonAncestorContainer.textContent,
    };

    let parent = range.commonAncestorContainer;
    while (parent && parent.nodeType !== Node.ELEMENT_NODE) {
      parent = parent.parentNode;
    }

    if (parent) {
      selectionInfo.isContentEditable =
        parent.isContentEditable ||
        parent.getAttribute('contenteditable') === 'true' ||
        parent.closest('[contenteditable="true"]') !== null;

      if (selectionInfo.isContentEditable) {
        selectionInfo.parentElement = {
          tagName: parent.tagName,
          className: parent.className,
          id: parent.id,
          innerHTML: parent.innerHTML,
          textContent: parent.textContent,
        };
      }
    }
  }

  if (
    activeElement &&
    (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
  ) {
    selectionInfo.activeElement = {
      tagName: activeElement.tagName,
      className: activeElement.className,
      id: activeElement.id,
      selectionStart: activeElement.selectionStart,
      selectionEnd: activeElement.selectionEnd,
    };
  }

  return selectionInfo;
}

function injectContentScript(tabId, callback) {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      files: ['content.js'],
    },
    () => {
      setTimeout(callback, 50);
    }
  );
}

function sendMessageWithRetry(tabId, message, maxRetries = 1) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    if (maxRetries > 0) {
      setTimeout(() => {
        sendMessageWithRetry(tabId, message, maxRetries - 1);
      }, 100);
    }
  });
}

function sendRephraseMessage(tabId, selectionText, selectionInfo) {
  chrome.tabs.sendMessage(
    tabId,
    {
      action: 'autoRephrase',
      text: selectionText,
      selectionInfo: selectionInfo,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        chrome.tabs.sendMessage(tabId, {
          action: 'autoRephrase',
          text: selectionText,
          selectionInfo: { text: selectionText },
        });
      }
    }
  );
}
