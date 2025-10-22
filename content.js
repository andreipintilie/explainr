if (typeof window.nanoAssistantInitialized === 'undefined') {
  window.nanoAssistantInitialized = true;

  let nanoAssistantModal = document.getElementById('nano-assistant-modal');

  if (!nanoAssistantModal) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('assets/overlay.css');
    document.head.appendChild(link);

    nanoAssistantModal = document.createElement('div');
    nanoAssistantModal.id = 'nano-assistant-modal';
    nanoAssistantModal.className = 'nano-assistant-modal';
    nanoAssistantModal.innerHTML = `
    <div class="nano-assistant-modal-content">
      <span class="nano-assistant-close-button">&times;</span>
      <div class="nano-assistant-modal-header">
        <img src="${chrome.runtime.getURL(
          'assets/icon48.png'
        )}" width="20" height="20" alt="nano-assistant Logo" class="nano-assistant-modal-logo">
        <h2>Explain with AI</h2>
      </div>
      <div class="nano-assistant-selected-text-container">
        <h3>Selected Text:</h3>
        <p id="nano-assistant-modal-selected-text" contenteditable></p>
      </div>
      <div class="nano-assistant-context-input-container">
        <h3>Additional Context (optional):</h3>
        <textarea id="nano-assistant-modal-context-input" rows="4" placeholder="Add more details or specific questions..."></textarea>
      </div>
      <div class="nano-assistant-actions">
        <button id="nano-assistant-modal-explain-button">Explain</button>
        <button id="nano-assistant-modal-history-button">History</button>
      </div>
      <div id="nano-assistant-modal-explanation" class="nano-assistant-explanation-output"></div>
    </div>
  `;
    document.body.appendChild(nanoAssistantModal);

    const historyOverlay = document.createElement('div');
    historyOverlay.id = 'nano-assistant-history-overlay';
    historyOverlay.className = 'nano-assistant-history-overlay';
    historyOverlay.innerHTML = `
      <div class="nano-assistant-history-overlay-content">
        <div class="nano-assistant-history-overlay-header">
          <button id="nano-assistant-history-back-button" class="nano-assistant-history-back-button">← Back</button>
          <h2>Explanation History</h2>
          <button id="nano-assistant-history-clear-button" class="nano-assistant-history-clear-button">Clear All</button>
        </div>
        <div id="nano-assistant-history-overlay-list" class="nano-assistant-history-overlay-list">
          <p class="nano-assistant-no-history">Explanation History is empty</p>
        </div>
      </div>
    `;
    document.body.appendChild(historyOverlay);

    function saveToHistory(text, explanation, context = '') {
      const history = getHistory();
      const entry = {
        id: Date.now(),
        text: text,
        explanation: explanation,
        context: context,
        timestamp: new Date().toLocaleString(),
      };
      history.unshift(entry);

      if (history.length > 10) {
        history.splice(10);
      }

      localStorage.setItem('nano-assistant-history', JSON.stringify(history));
    }

    function getHistory() {
      try {
        return JSON.parse(localStorage.getItem('nano-assistant-history')) || [];
      } catch (e) {
        return [];
      }
    }

    function clearHistory() {
      localStorage.removeItem('nano-assistant-history');
      displayHistory();
    }

    function displayHistory() {
      const history = getHistory();
      const historyList = document.getElementById(
        'nano-assistant-history-overlay-list'
      );

      if (history.length === 0) {
        historyList.innerHTML =
          '<p class="nano-assistant-no-history">No explanations yet. Start by explaining some text!</p>';
        return;
      }

      historyList.innerHTML = history
        .map(
          (entry) => `
        <div class="nano-assistant-history-item" data-id="${entry.id}">
          <div class="nano-assistant-history-text">"${entry.text.substring(0, 150)}${
            entry.text.length > 150 ? '...' : ''
          }"</div>
          ${
            entry.context
              ? `<div class="nano-assistant-history-context">Context: ${entry.context}</div>`
              : ''
          }
        </div>
      `
        )
        .join('');

      document.querySelectorAll('.nano-assistant-history-item').forEach((item) => {
        item.addEventListener('click', function () {
          const entryId = parseInt(this.dataset.id);
          const entry = history.find((h) => h.id === entryId);
          if (entry) {
            document.getElementById(
              'nano-assistant-modal-selected-text'
            ).textContent = entry.text;
            document.getElementById('nano-assistant-modal-context-input').value =
              entry.context || '';

            const explanationOutput = document.getElementById(
              'nano-assistant-modal-explanation'
            );
            const historyOverlay = document.getElementById(
              'nano-assistant-history-overlay'
            );

            explanationOutput.innerHTML = '<p>' + entry.explanation + '</p>';
            explanationOutput.style.display = 'block';
            historyOverlay.classList.remove('show');
            document.body.classList.remove('nano-assistant-history-overlay-open');
          }
        });
      });
    }

    document.getElementById('nano-assistant-modal-history-button').onclick =
      function () {
        const historyOverlay = document.getElementById(
          'nano-assistant-history-overlay'
        );
        displayHistory();
        historyOverlay.classList.add('show');
        document.body.classList.add('nano-assistant-history-overlay-open');
      };

    document.getElementById('nano-assistant-history-back-button').onclick =
      function () {
        const historyOverlay = document.getElementById(
          'nano-assistant-history-overlay'
        );
        historyOverlay.classList.remove('show');
        document.body.classList.remove('nano-assistant-history-overlay-open');
      };

    document.getElementById('nano-assistant-history-clear-button').onclick =
      function () {
        if (
          confirm('Are you sure you want to clear all explanation history?')
        ) {
          clearHistory();
        }
      };

    document.getElementById('nano-assistant-history-overlay').onclick = function (
      event
    ) {
      if (event.target === this) {
        this.classList.remove('show');
        document.body.classList.remove('nano-assistant-history-overlay-open');
      }
    };

    document.getElementById('nano-assistant-modal-explain-button').onclick =
      async () => {
        const selectedText = document.getElementById(
          'nano-assistant-modal-selected-text'
        ).textContent;
        const additionalContext = document.getElementById(
          'nano-assistant-modal-context-input'
        ).value;
        const explanationOutput = document.getElementById(
          'nano-assistant-modal-explanation'
        );

        explanationOutput.style.display = 'block';
        explanationOutput.textContent = 'Loading explanation...';

        try {
          if (!window.LanguageModel) {
            throw new Error(
              'LanguageModel API is not available. Please ensure you have Chrome Canary with AI features enabled.'
            );
          }

          const session = await window.LanguageModel.create({
            model: '@chrome/gemini-nano',
            stream: true,
          });

          let prompt = `Explain the following text: "${selectedText}"`;
          if (additionalContext) {
            prompt += `\nAdditional context: ${additionalContext}`;
          }

          const response = await session.prompt(prompt, {
            outputLanguage: 'en',
          });
          let explanation = '';
          for await (const chunk of response) {
            explanation += chunk;
          }

          const parsedContent =
            typeof parseMarkdown === 'function'
              ? parseMarkdown(explanation)
              : explanation;
          explanationOutput.innerHTML = '<p>' + parsedContent + '</p>';

          saveToHistory(selectedText, parsedContent, additionalContext);
        } catch (error) {
          console.error('Error explaining text:', error);
          explanationOutput.innerHTML = `<p style="color: red;">Error: ${
            error.message ||
            'Failed to get explanation. Please make sure you have Chrome Canary with AI features enabled.'
          }</p>`;
        }
      };

    nanoAssistantModal.querySelector('.nano-assistant-close-button').onclick = () => {
      nanoAssistantModal.classList.remove('show');
      document.body.classList.remove('nano-assistant-modal-open');
    };

    nanoAssistantModal.onclick = (event) => {
      if (event.target === nanoAssistantModal) {
        nanoAssistantModal.classList.remove('show');
        document.body.classList.remove('nano-assistant-modal-open');
      }
    };
  }

  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'showExplanation') {
      const selectedTextElement = document.getElementById(
        'nano-assistant-modal-selected-text'
      );
      const contextInput = document.getElementById(
        'nano-assistant-modal-context-input'
      );
      const explanationOutput = document.getElementById(
        'nano-assistant-modal-explanation'
      );

      if (selectedTextElement && contextInput && explanationOutput) {
        if (request.noSelection) {
          selectedTextElement.textContent = '';
          contextInput.value = '';
          explanationOutput.textContent =
            'Please provide context or questions below to get an explanation.';
        } else if (request.text) {
          selectedTextElement.textContent = request.text;
          contextInput.value = '';
          explanationOutput.textContent = '';
        }
        nanoAssistantModal.classList.add('show');
      document.body.classList.add('nano-assistant-modal-open');
      }
    }
  });
}
