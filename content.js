if (typeof window.explainrInitialized === 'undefined') {
  window.explainrInitialized = true;

  let explainrModal = document.getElementById('explainr-modal');

  if (!explainrModal) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.runtime.getURL('assets/overlay.css');
    document.head.appendChild(link);

    explainrModal = document.createElement('div');
    explainrModal.id = 'explainr-modal';
    explainrModal.className = 'explainr-modal';
    explainrModal.innerHTML = `
    <div class="explainr-modal-content">
      <span class="explainr-close-button">&times;</span>
      <div class="explainr-modal-header">
        <img src="${chrome.runtime.getURL(
          'assets/icon48.png'
        )}" width="20" height="20" alt="Explainr Logo" class="explainr-modal-logo">
        <h2>Explain with AI</h2>
      </div>
      <div class="explainr-selected-text-container">
        <h3>Selected Text:</h3>
        <p id="explainr-modal-selected-text"></p>
      </div>
      <div class="explainr-context-input-container">
        <h3>Additional Context (optional):</h3>
        <textarea id="explainr-modal-context-input" rows="4" placeholder="Add more details or specific questions..."></textarea>
      </div>
      <div class="explainr-actions">
        <button id="explainr-modal-explain-button">Explain</button>
      </div>
      <div id="explainr-modal-explanation" class="explainr-explanation-output"></div>
    </div>
  `;
    document.body.appendChild(explainrModal);

    document.getElementById('explainr-modal-explain-button').onclick =
      async () => {
        const selectedText = document.getElementById(
          'explainr-modal-selected-text'
        ).textContent;
        const additionalContext = document.getElementById(
          'explainr-modal-context-input'
        ).value;
        const explanationOutput = document.getElementById(
          'explainr-modal-explanation'
        );

        explanationOutput.textContent = 'Loading explanation...';

        try {
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

          const parsedContent = parseMarkdown(explanation);
          explanationOutput.innerHTML = '<p>' + parsedContent + '</p>';
        } catch (error) {
          console.error('Error explaining text:', error);
          explanationOutput.textContent = `Error: ${
            error.message || 'Failed to get explanation.'
          }`;
        }
      };

    explainrModal.querySelector('.explainr-close-button').onclick = () => {
      explainrModal.classList.remove('show');
    };

    explainrModal.onclick = (event) => {
      if (event.target === explainrModal) {
        explainrModal.classList.remove('show');
      }
    };
  }

  chrome.runtime.onMessage.addListener(async (request) => {
    if (request.action === 'showExplanation') {
      const selectedTextElement = document.getElementById(
        'explainr-modal-selected-text'
      );
      const contextInput = document.getElementById(
        'explainr-modal-context-input'
      );
      const explanationOutput = document.getElementById(
        'explainr-modal-explanation'
      );

      if (selectedTextElement && contextInput && explanationOutput) {
        if (request.noSelection) {
          selectedTextElement.textContent = 'No text selected.';
          contextInput.value = '';
          explanationOutput.textContent =
            'Highlight text and try again, or provide context below.';
        } else if (request.text) {
          selectedTextElement.textContent = request.text;
          contextInput.value = '';
          explanationOutput.textContent = '';
        }
        explainrModal.classList.add('show');
      }
    }
  });
}
