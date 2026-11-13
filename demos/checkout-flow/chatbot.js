(function () {
  const chatLog = document.getElementById('chatLog');
  const reasonBox = document.getElementById('reasonBox');
  const submitReasonBtn = document.getElementById('submitReasonBtn');
  const reasonActions = document.getElementById('reasonActions');
  const radios = Array.from(document.querySelectorAll('input[name="declineReason"]'));
  const reasonTitle = reasonBox.querySelector('.reason-title');
  const reasonOptions = Array.from(reasonBox.querySelectorAll('.reason-option'));
  const otherWrap = document.getElementById('otherInputWrap');
  const otherInput = document.getElementById('otherInput');
  const sendOtherBtn = document.getElementById('sendOtherBtn');
  const initialBotBubble = document.getElementById('initialBotBubble');
  const chatbotPopup = document.getElementById('chatbotPopup');
  const minimizeChatBtn = document.getElementById('minimizeChatBtn');
  const openChatBtn = document.getElementById('openChatBtn');
  const chatOverlay = document.getElementById('chatOverlay');
  const selectedReasons = new Set();
  let roundInProgress = false;
  let awaitingTechnicalOtherDetail = false;
  let awaitingMissingUpiAppDetail = false;
  let closingMessageShown = false;
  let selectedReasonValue = '';
  let chatStarted = false;
  let autoOpenTimerId = null;

  const SEND_ICON_SVG =
    '<svg class="btn-send-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94l16.5-8.25a.75.75 0 0 0 0-1.34L3.478 2.405Z"/>' +
    '</svg>';

  function createSendMessageButton(options = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const classes = ['btn', 'btn-send-message'];
    if (options.inline) classes.push('btn-inline');
    if (options.extraClass) classes.push(options.extraClass);
    btn.className = classes.join(' ');
    btn.innerHTML = '<span class="btn-send-label">Send Message</span>' + SEND_ICON_SVG;
    if (options.disabled) btn.disabled = true;
    return btn;
  }

  const responses = {
    insufficient_funds:
      "Thanks for sharing.\nPlease check your available balance and retry with a sufficient amount.",
    missing_upi_apps:
      "Which UPI app do you use that is missing from our list?",
    verification_or_wrong_pin:
      "Noted, you can try again",
    could_not_scan_qr:
      "Sorry to hear that.\nYou can try completing your transaction using your mobile instead of doing from desktop."
  };

  function addBubble(text, type) {
    const el = document.createElement('div');
    el.className = 'bubble ' + type;
    el.textContent = text;
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function typeTextIntoBubble(el, text, speed) {
    el.textContent = '';
    for (const char of text) {
      el.textContent += char;
      chatLog.scrollTop = chatLog.scrollHeight;
      await wait(speed);
    }
  }

  async function addTypingBotBubble(text, speed) {
    const el = document.createElement('div');
    el.className = 'bubble bot';
    el.innerHTML = '<span class="typing-indicator"><span></span><span></span><span></span></span>';
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    await wait(650);
    await typeTextIntoBubble(el, text, speed);
  }

  function uniqueChoiceGroupName(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 11);
  }

  function revealChoiceOptions(wrap) {
    if (!wrap) return;
    const options = Array.from(wrap.querySelectorAll('.choice-option'));
    options.forEach((option, index) => {
      option.style.animationDelay = (index * 90) + 'ms';
    });
    requestAnimationFrame(() => {
      wrap.classList.add('is-revealed');
    });
  }

  function syncChoiceFollowupSend(actions, selectedLabel) {
    if (!actions) return;
    if (!selectedLabel) {
      actions.classList.remove('is-visible');
      return;
    }
    actions.classList.add('is-visible');
    selectedLabel.insertAdjacentElement('afterend', actions);
  }

  function askYesNoChoice(question) {
    return new Promise(async (resolve) => {
      await addTypingBotBubble(question, 20);
      const wrap = document.createElement('div');
      wrap.className = 'choice-radios';
      wrap.setAttribute('role', 'radiogroup');
      const name = uniqueChoiceGroupName('yesno');
      let selected = null;

      const actions = document.createElement('div');
      actions.className = 'chat-actions choice-actions-inline choice-followup-send';
      const sendBtn = createSendMessageButton({ disabled: true });
      actions.appendChild(sendBtn);

      [['yes', 'Yes'], ['no', 'No']].forEach(([value, labelText]) => {
        const label = document.createElement('label');
        label.className = 'choice-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = value;
        const span = document.createElement('span');
        span.textContent = labelText;
        label.appendChild(input);
        label.appendChild(span);

        input.addEventListener('change', () => {
          if (!input.checked) return;
          selected = { value, label: labelText };
          sendBtn.disabled = false;
          syncChoiceFollowupSend(actions, label);
        });

        wrap.appendChild(label);
      });

      sendBtn.addEventListener('click', () => {
        if (!selected) return;
        wrap.classList.add('is-locked');
        wrap.querySelectorAll('input[type="radio"]').forEach((r) => {
          r.disabled = true;
        });
        sendBtn.disabled = true;
        addBubble(selected.label, 'user');
        resolve(selected.value);
      });

      revealChoiceOptions(wrap);
      chatLog.appendChild(wrap);
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  }

  function askOptionChoice(question, options) {
    return new Promise(async (resolve) => {
      if (question) {
        await addTypingBotBubble(question, 20);
      }
      const wrap = document.createElement('div');
      wrap.className = 'choice-radios';
      wrap.setAttribute('role', 'radiogroup');
      const name = uniqueChoiceGroupName('followup');
      let selected = null;

      const actions = document.createElement('div');
      actions.className = 'chat-actions choice-actions-inline choice-followup-send';
      const sendBtn = createSendMessageButton({ disabled: true });
      actions.appendChild(sendBtn);

      options.forEach((option) => {
        const label = document.createElement('label');
        label.className = 'choice-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = option.value;
        const span = document.createElement('span');
        span.textContent = option.label;
        label.appendChild(input);
        label.appendChild(span);

        input.addEventListener('change', () => {
          if (!input.checked) return;
          selected = { value: option.value, label: option.label };
          sendBtn.disabled = false;
          syncChoiceFollowupSend(actions, label);
        });

        wrap.appendChild(label);
      });

      sendBtn.addEventListener('click', () => {
        if (!selected) return;
        wrap.classList.add('is-locked');
        wrap.querySelectorAll('input[type="radio"]').forEach((r) => {
          r.disabled = true;
        });
        sendBtn.disabled = true;
        addBubble(selected.label, 'user');
        resolve(selected.value);
      });

      revealChoiceOptions(wrap);
      chatLog.appendChild(wrap);
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  }

  async function handleBankBlockedFlow() {
    const BANK_GENERAL_RESPONSE =
      'We will try our best to resolve your issue.';
    const BANK_DAILY_LIMIT_RESPONSE =
      'Please try again tomorrow once limit resets.';

    const selectedOption = await new Promise(async (resolve) => {
      await addTypingBotBubble(
        'What was the exact reason given?',
        20
      );

      const wrap = document.createElement('div');
      wrap.className = 'bank-block-followup';

      const radiosWrap = document.createElement('div');
      radiosWrap.className = 'choice-radios';
      radiosWrap.setAttribute('role', 'radiogroup');
      const name = uniqueChoiceGroupName('bank_block_followup');

      const options = [
        {
          value: 'security_reasons',
          label: 'The bank blocked it for security reasons'
        },
        {
          value: 'daily_payment_limit',
          label: 'You have reached your maximum daily payment limit'
        },
        {
          value: 'receiving_bank_unavailable',
          label:
            'The receiving bank is currently unavailable and unable to process the transaction.'
        },
        { value: 'other', label: 'Other' }
      ];

      const otherWrap = document.createElement('div');
      otherWrap.className = 'bank-block-other-wrap';
      otherWrap.hidden = true;
      let selectedOption = null;

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'bank-block-other-input';
      textInput.placeholder = 'Please tell us what happened';

      const actions = document.createElement('div');
      actions.className = 'chat-actions choice-actions-inline choice-followup-send';
      const sendBtn = createSendMessageButton({ disabled: true });

      function lockAll() {
        wrap.classList.add('is-locked');
        radiosWrap.querySelectorAll('input[type="radio"]').forEach((r) => {
          r.disabled = true;
        });
        textInput.disabled = true;
        sendBtn.disabled = true;
      }

      options.forEach((option) => {
        const label = document.createElement('label');
        label.className = 'choice-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = option.value;
        const span = document.createElement('span');
        span.textContent = option.label;
        label.appendChild(input);
        label.appendChild(span);

        input.addEventListener('change', () => {
          if (!input.checked) return;
          selectedOption = option;
          syncChoiceFollowupSend(actions, label);
          if (option.value === 'other') {
            otherWrap.hidden = false;
            sendBtn.disabled = !textInput.value.trim();
            textInput.focus();
          } else {
            otherWrap.hidden = true;
            textInput.value = '';
            sendBtn.disabled = false;
          }
        });

        radiosWrap.appendChild(label);
      });

      sendBtn.addEventListener('click', () => {
        if (!selectedOption) return;
        if (selectedOption.value === 'other') {
          const text = textInput.value.trim();
          if (!text) return;
          lockAll();
          addBubble(text, 'user');
          resolve('other');
          return;
        }
        lockAll();
        addBubble(selectedOption.label, 'user');
        resolve(selectedOption.value);
      });

      textInput.addEventListener('input', () => {
        if (!selectedOption || selectedOption.value !== 'other') return;
        sendBtn.disabled = !textInput.value.trim();
      });

      textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          sendBtn.click();
        }
      });

      actions.appendChild(sendBtn);
      otherWrap.appendChild(textInput);
      wrap.appendChild(radiosWrap);
      wrap.appendChild(otherWrap);
      chatLog.appendChild(wrap);
      revealChoiceOptions(radiosWrap);
      chatLog.scrollTop = chatLog.scrollHeight;
    });

    if (selectedOption === 'daily_payment_limit') {
      await addTypingBotBubble(BANK_DAILY_LIMIT_RESPONSE, 24);
      return;
    }

    await addTypingBotBubble(BANK_GENERAL_RESPONSE, 24);
  }

  async function handleMultipleRedirectsFlow() {
    const REDIRECTS_GENERAL_RESPONSE =
      'We will try our best to resolve your issue.';

    const selectedOption = await new Promise(async (resolve) => {
      await addTypingBotBubble('Please choose one option:', 20);

      const wrap = document.createElement('div');
      wrap.className = 'bank-block-followup';

      const radiosWrap = document.createElement('div');
      radiosWrap.className = 'choice-radios';
      radiosWrap.setAttribute('role', 'radiogroup');
      const name = uniqueChoiceGroupName('redirects_followup');

      const options = [
        {
          value: 'unexpected_page',
          label: 'I was taken to a different page unexpectedly'
        },
        {
          value: 'returned_to_checkout',
          label:
            'After completing payment, I was redirected to the checkout screen where payment options are displayed'
        },
        { value: 'other', label: 'Other' }
      ];

      const otherWrap = document.createElement('div');
      otherWrap.className = 'bank-block-other-wrap';
      otherWrap.hidden = true;
      let selectedOption = null;

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'bank-block-other-input';
      textInput.placeholder = 'Please tell us what happened';

      const actions = document.createElement('div');
      actions.className = 'chat-actions choice-actions-inline choice-followup-send';
      const sendBtn = createSendMessageButton({ disabled: true });

      function lockAll() {
        wrap.classList.add('is-locked');
        radiosWrap.querySelectorAll('input[type="radio"]').forEach((r) => {
          r.disabled = true;
        });
        textInput.disabled = true;
        sendBtn.disabled = true;
      }

      options.forEach((option) => {
        const label = document.createElement('label');
        label.className = 'choice-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = option.value;
        const span = document.createElement('span');
        span.textContent = option.label;
        label.appendChild(input);
        label.appendChild(span);

        input.addEventListener('change', () => {
          if (!input.checked) return;
          selectedOption = option;
          syncChoiceFollowupSend(actions, label);
          if (option.value === 'other') {
            otherWrap.hidden = false;
            sendBtn.disabled = !textInput.value.trim();
            textInput.focus();
          } else {
            otherWrap.hidden = true;
            textInput.value = '';
            sendBtn.disabled = false;
          }
        });

        radiosWrap.appendChild(label);
      });

      sendBtn.addEventListener('click', () => {
        if (!selectedOption) return;
        if (selectedOption.value === 'other') {
          const text = textInput.value.trim();
          if (!text) return;
          lockAll();
          addBubble(text, 'user');
          resolve('other');
          return;
        }
        lockAll();
        addBubble(selectedOption.label, 'user');
        resolve(selectedOption.value);
      });

      textInput.addEventListener('input', () => {
        if (!selectedOption || selectedOption.value !== 'other') return;
        sendBtn.disabled = !textInput.value.trim();
      });

      textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          sendBtn.click();
        }
      });

      actions.appendChild(sendBtn);
      otherWrap.appendChild(textInput);
      wrap.appendChild(radiosWrap);
      wrap.appendChild(otherWrap);
      chatLog.appendChild(wrap);
      revealChoiceOptions(radiosWrap);
      chatLog.scrollTop = chatLog.scrollHeight;
    });

    if (selectedOption === 'unexpected_page') {
      await addTypingBotBubble(
        'Some payment methods require redirection to a secure banking or payment page for authorization.',
        24
      );
      return;
    }

    await addTypingBotBubble(REDIRECTS_GENERAL_RESPONSE, 24);
  }

  async function handleTechnicalErrorFlow() {
    const selectedOption = await askOptionChoice(
      'Please choose one option:',
      [
        { value: 'page_not_loaded', label: 'Page did not load?' },
        { value: 'error_code_shown', label: 'Error code shown?' },
        { value: 'frozen_screen', label: 'Frozen screen?' },
        { value: 'other', label: 'Other?' }
      ]
    );

    if (selectedOption === 'other') {
      await addTypingBotBubble('Please explain.', 20);
      chatLog.appendChild(reasonBox);
      chatLog.scrollTop = chatLog.scrollHeight;
      awaitingTechnicalOtherDetail = true;
      showTrustFollowupInputOnly();
      otherWrap.style.display = 'flex';
      otherInput.disabled = false;
      otherInput.value = '';
      otherInput.placeholder = 'Please tell us the technical issue';
      sendOtherBtn.disabled = false;
      sendOtherBtn.style.display = 'inline-flex';
      otherInput.focus();
      return false;
    }

    await addTypingBotBubble('We will try our best to resolve your issue.', 24);
    return true;
  }

  async function handleOtherAppsButtonFlow() {
    await new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'other-apps-followup';

      const radiosWrap = document.createElement('div');
      radiosWrap.className = 'choice-radios';
      radiosWrap.setAttribute('role', 'radiogroup');
      const name = uniqueChoiceGroupName('otherapps_fail');

      const labelEl = document.createElement('label');
      labelEl.className = 'choice-option';
      const radioInput = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.name = name;
      radioInput.value = 'app_list_failed_to_open';
      const radioSpan = document.createElement('span');
      radioSpan.textContent = 'App list failed to open';
      labelEl.appendChild(radioInput);
      labelEl.appendChild(radioSpan);
      radiosWrap.appendChild(labelEl);

      const hint = document.createElement('p');
      hint.className = 'other-apps-followup-hint';
      hint.textContent = 'Anything else you want to describe';

      const inputRow = document.createElement('div');
      inputRow.className = 'other-apps-followup-input-row';
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'other-apps-followup-input';
      textInput.placeholder = 'Describe what happened';

      const radioActions = document.createElement('div');
      radioActions.className = 'chat-actions choice-actions-inline choice-followup-send';
      const radioSendBtn = createSendMessageButton({ disabled: true });
      radioActions.appendChild(radioSendBtn);

      const textActions = document.createElement('div');
      textActions.className = 'chat-actions choice-actions-inline choice-followup-send is-visible';
      const textSendBtn = createSendMessageButton();

      function lockAll() {
        wrap.classList.add('is-locked');
        radioInput.disabled = true;
        textInput.disabled = true;
        radioSendBtn.disabled = true;
        textSendBtn.disabled = true;
      }

      radioInput.addEventListener('change', () => {
        if (!radioInput.checked) return;
        radioSendBtn.disabled = false;
        syncChoiceFollowupSend(radioActions, labelEl);
      });

      radioSendBtn.addEventListener('click', () => {
        if (!radioInput.checked) return;
        lockAll();
        addBubble('App list failed to open', 'user');
        resolve('fail_open');
      });

      textSendBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (!text) return;
        lockAll();
        addBubble(text, 'user');
        resolve('crash_described');
      });

      textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          textSendBtn.click();
        }
      });

      wrap.appendChild(radiosWrap);
      wrap.appendChild(hint);
      inputRow.appendChild(textInput);
      wrap.appendChild(inputRow);
      textActions.appendChild(textSendBtn);
      wrap.appendChild(textActions);

      chatLog.appendChild(wrap);
      revealChoiceOptions(radiosWrap);
      chatLog.scrollTop = chatLog.scrollHeight;
    });

    await addTypingBotBubble('Noted, we will try to resolve your issue soon', 24);
  }

  async function handleAppOpenedClosedFlow() {
    await addTypingBotBubble('Which app were you trying to use?', 20);

    await new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'app-closed-followup';

      const inputRow = document.createElement('div');
      inputRow.className = 'app-closed-followup-input-row';
      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'app-closed-followup-input';
      textInput.placeholder = 'Enter app name';

      const actions = document.createElement('div');
      actions.className = 'chat-actions choice-actions-inline choice-followup-send is-visible';
      const sendBtn = createSendMessageButton();

      sendBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (!text) return;
        wrap.classList.add('is-locked');
        textInput.disabled = true;
        sendBtn.disabled = true;
        addBubble(text, 'user');
        resolve();
      });

      textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          sendBtn.click();
        }
      });

      inputRow.appendChild(textInput);
      wrap.appendChild(inputRow);
      actions.appendChild(sendBtn);
      wrap.appendChild(actions);

      chatLog.appendChild(wrap);
      chatLog.scrollTop = chatLog.scrollHeight;
    });

    const subChoice = await askOptionChoice('', [
      { value: 'crashed_after_open', label: 'App crashed after opening' },
      { value: 'not_redirected', label: "I wasn't redirected to the app" }
    ]);

    if (subChoice === 'not_redirected') {
      await addTypingBotBubble('Please try again with a better internet', 24);
    } else {
      await addTypingBotBubble('Please try different app', 24);
    }
  }

  async function handleTrustPaymentFlow() {
    const choice = await askOptionChoice('', [
      { value: 'merchant_name_mismatch', label: "The merchant name didn't match the expected name" },
      { value: 'amount_mismatch', label: 'The amount shown in payment app was different from the checkout total' },
      { value: 'security_warning', label: 'A security warning appeared for the merchant' },
      { value: 'merchant_not_visible_url', label: 'Merchant name was not visible on the checkout page URL' },
      { value: 'other', label: 'Other' }
    ]);

    if (choice === 'other') {
      await new Promise((resolve) => {
        const wrap = document.createElement('div');
        wrap.className = 'app-closed-followup';

        const inputRow = document.createElement('div');
        inputRow.className = 'app-closed-followup-input-row';
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'app-closed-followup-input';
        textInput.placeholder = 'Please describe what happened';

        const actions = document.createElement('div');
        actions.className = 'chat-actions choice-actions-inline choice-followup-send is-visible';
        const sendBtn = createSendMessageButton();

        sendBtn.addEventListener('click', () => {
          const text = textInput.value.trim();
          if (!text) return;
          wrap.classList.add('is-locked');
          textInput.disabled = true;
          sendBtn.disabled = true;
          addBubble(text, 'user');
          resolve();
        });

        textInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            sendBtn.click();
          }
        });

        inputRow.appendChild(textInput);
        wrap.appendChild(inputRow);
        actions.appendChild(sendBtn);
        wrap.appendChild(actions);

        chatLog.appendChild(wrap);
        chatLog.scrollTop = chatLog.scrollHeight;
      });
    } else if (choice === 'merchant_name_mismatch') {
      await addTypingBotBubble(
        'This is expected behavior. For secure and reliable processing, payments may sometimes be routed through our subsidiary merchants. This is part of our secure automatic payment routing system.',
        20
      );
    } else if (choice === 'amount_mismatch') {
      await addTypingBotBubble('Noted, we will try to resolve your issue soon', 24);
    } else if (choice === 'security_warning') {
      await addTypingBotBubble(
        'Your security is important to us. All merchants on our platform are verified and secure. This warning may appear because of high transaction activity or bank security checks. Some payment apps may display precautionary warnings as part of their security process.',
        20
      );
    } else if (choice === 'merchant_not_visible_url') {
      await addTypingBotBubble(
        'Your payment security is important to us. Transactions are routed through our secure checkout domain, which may not display the merchant name in the web address.',
        20
      );
    }

    // Keep a single closing thank-you from finishConversation().
  }

  async function handleNetworkDeviceIssueFlow() {
    const choice = await askOptionChoice('', [
      { value: 'page_failed_to_load', label: 'Page failed to load' },
      { value: 'screen_stuck_during_payment', label: 'Screen got stuck during payment' },
      { value: 'error_message_or_code', label: 'An error message or code was shown' },
      { value: 'payment_taking_too_long', label: 'Payment is taking too long to process' }
    ]);

    if (choice === 'page_failed_to_load') {
      await addTypingBotBubble('Please check your internet connection and try again.', 24);
    } else if (choice === 'screen_stuck_during_payment') {
      await addTypingBotBubble(
        'Please try completing the payment from a different device or restart the app/browser and try again.',
        24
      );
    } else if (choice === 'error_message_or_code') {
      await addTypingBotBubble(
        'Please try again using a different browser or update your current browser to the latest version.',
        24
      );
    } else if (choice === 'payment_taking_too_long') {
      await addTypingBotBubble(
        'Please wait a few moments and avoid refreshing or closing the page. If the issue continues, try again with a stable internet connection',
        24
      );
    }

  }

  function getSelectedReason() {
    const checked = getApplicableReasonRadios().find((r) => r.checked);
    return checked ? checked.value : '';
  }

  function revealReasonOptions() {
    reasonBox.classList.add('is-visible');
    const options = Array.from(reasonBox.querySelectorAll('.reason-option'));
    options.forEach((option, index) => {
      option.style.animationDelay = (index * 90) + 'ms';
    });
  }

  function hideUsedReason(reasonValue) {
    const usedRadio = radios.find((radio) => radio.value === reasonValue);
    if (!usedRadio) return;
    const label = usedRadio.parentElement;
    if (!label) return;
    usedRadio.disabled = true;
    usedRadio.checked = true;
    label.classList.add('is-disabled');
    label.classList.add('is-selected');
  }

  const DESKTOP_REASON_VALUES = new Set([
    'insufficient_funds',
    'bank_block',
    'verification_or_wrong_pin',
    'network_timeout',
    'multiple_redirects_confusing',
    'technical_error',
    'could_not_scan_qr'
  ]);

  function isDesktopReasonView() {
    return window.matchMedia('(min-width: 768px)').matches;
  }

  const MOBILE_HIDDEN_REASON_VALUES = new Set(['could_not_scan_qr']);

  function isReasonAvailableOnCurrentView(radio) {
    if (isDesktopReasonView()) {
      return DESKTOP_REASON_VALUES.has(radio.value);
    }
    return !MOBILE_HIDDEN_REASON_VALUES.has(radio.value);
  }

  function getApplicableReasonRadios() {
    return radios.filter(isReasonAvailableOnCurrentView);
  }

  function countRemainingReasons() {
    return getApplicableReasonRadios().filter((radio) => !selectedReasons.has(radio.value)).length;
  }

  function restoreReasonActionsPosition() {
    if (!reasonBox || !reasonActions) return;
    reasonActions.classList.remove('reason-actions--inline');
    reasonActions.style.display = 'none';
    reasonBox.appendChild(reasonActions);
  }

  function placeReasonActionsAfterSelection() {
    if (!reasonActions) return;
    const reason = getSelectedReason();
    if (!reason || reason === 'other') {
      restoreReasonActionsPosition();
      return;
    }
    const selectedRadio = getApplicableReasonRadios().find((r) => r.checked);
    const selectedOption = selectedRadio?.parentElement;
    if (!selectedOption) {
      restoreReasonActionsPosition();
      return;
    }
    reasonActions.classList.add('reason-actions--inline');
    selectedOption.insertAdjacentElement('afterend', reasonActions);
    reasonActions.style.display = 'flex';
    requestAnimationFrame(() => {
      reasonActions.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function resetReasonInputState() {
    closingMessageShown = false;
    roundInProgress = false;
    awaitingTechnicalOtherDetail = false;
    awaitingMissingUpiAppDetail = false;
    reasonBox.classList.remove('trust-followup-only');
    reasonBox.classList.remove('is-locked');
    reasonBox.classList.remove('other-input-active');
    reasonTitle.style.display = '';
    submitReasonBtn.disabled = true;
    reasonActions.style.display = 'flex';
    otherWrap.style.display = 'none';
    otherInput.value = '';
    otherInput.disabled = false;
    otherInput.placeholder = 'Please tell us what happened';
    sendOtherBtn.disabled = false;
    sendOtherBtn.style.display = 'inline-flex';

    radios.forEach((radio) => {
      const label = radio.parentElement;
      if (!label) return;
      if (selectedReasons.has(radio.value)) {
        radio.disabled = true;
        radio.checked = false;
        label.classList.add('is-disabled');
        label.classList.remove('is-selected');
      } else if (!isReasonAvailableOnCurrentView(radio)) {
        radio.checked = false;
        radio.disabled = true;
        label.classList.remove('is-disabled', 'is-selected');
      } else {
        radio.checked = false;
        radio.disabled = false;
        label.classList.remove('is-disabled', 'is-selected');
      }
    });
    reasonOptions.forEach((option) => {
      const radio = option.querySelector('input[type="radio"]');
      option.style.display = '';
      option.classList.toggle('is-disabled', selectedReasons.has(radio.value));
    });
    restoreReasonActionsPosition();
  }

  function showTrustFollowupInputOnly() {
    if (chatLog) {
      chatLog.classList.add('has-user-scrolled');
    }
    reasonBox.classList.add('trust-followup-only');
    reasonTitle.style.display = 'none';
    reasonOptions.forEach((option) => {
      option.style.display = 'none';
    });
    reasonActions.style.display = 'none';
  }

  async function promptForRemainingReasons() {
    const remaining = countRemainingReasons();
    if (remaining <= 0) {
      reasonBox.classList.add('is-locked');
      reasonActions.style.display = 'none';
      otherWrap.style.display = 'none';
      await addTypingBotBubble('Thank you for sharing all the reasons.', 24);
      return;
    }
    await addTypingBotBubble('Is there any other reason? Please choose.', 20);
    chatLog.appendChild(reasonBox);
    chatLog.scrollTop = chatLog.scrollHeight;
    resetReasonInputState();
  }

  function endReasonSelection() {
    roundInProgress = true;
    reasonBox.classList.add('is-locked');
    reasonActions.style.display = 'none';
    otherWrap.style.display = 'none';
    radios.forEach((radio) => {
      radio.disabled = true;
      radio.parentElement.classList.add('is-disabled');
      radio.parentElement.classList.toggle('is-selected', radio.value === selectedReasonValue);
      if (radio.value !== selectedReasonValue) {
        radio.checked = false;
      }
    });
  }

  function showPostReasonActionsRow() {
    const actions = document.createElement('div');
    actions.className = 'chat-actions post-reason-actions';

    const remaining = countRemainingReasons();

    if (remaining > 0) {
      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'btn';
      retryBtn.textContent = 'Choose another reason';
      retryBtn.addEventListener('click', () => {
        actions.remove();
        addBubble('Choose another reason', 'user');
        resetReasonInputState();
        reasonBox.classList.remove('is-locked');
        chatLog.appendChild(reasonBox);
        chatLog.scrollTop = chatLog.scrollHeight;
      });
      actions.appendChild(retryBtn);
    }

    const homeBtn = document.createElement('button');
    homeBtn.type = 'button';
    homeBtn.className = remaining > 0 ? 'btn btn-secondary-outline' : 'btn';
    homeBtn.textContent = 'Return to Home';
    homeBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    actions.appendChild(homeBtn);

    chatLog.appendChild(actions);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  async function finishConversation() {
    if (!closingMessageShown) {
      await addTypingBotBubble('Thank you for chatting with us.', 24);
      closingMessageShown = true;
    }
    showPostReasonActionsRow();
    if (chatLog) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }

  async function completeReasonFlow(finalMessage) {
    endReasonSelection();
    await addTypingBotBubble(finalMessage, 24);
    await finishConversation();
  }

  function setupPopupControls() {
    if (!chatbotPopup || !minimizeChatBtn || !openChatBtn) return;
    minimizeChatBtn.addEventListener('click', () => {
      chatbotPopup.classList.add('minimized');
      if (chatOverlay) chatOverlay.classList.add('hidden');
      openChatBtn.classList.remove('is-background');
      openChatBtn.classList.add('is-glow');
    });
    openChatBtn.addEventListener('click', () => {
      if (autoOpenTimerId) {
        clearTimeout(autoOpenTimerId);
        autoOpenTimerId = null;
      }
      openChatBtn.classList.remove('is-glow');
      startChatFlow();
    });
  }

  function setupMobileStickyReveal() {
    if (!chatLog) return;
    const updateReveal = () => {
      if (chatLog.classList.contains('keep-sticky-actions')) {
        chatLog.classList.add('has-user-scrolled');
        return;
      }
      const hasScrolled = chatLog.scrollTop > 4;
      chatLog.classList.toggle('has-user-scrolled', hasScrolled);
    };
    chatLog.addEventListener('scroll', updateReveal, { passive: true });
    updateReveal();
  }

  function showChatPopup() {
    if (chatbotPopup) chatbotPopup.classList.remove('minimized');
    if (chatOverlay) chatOverlay.classList.remove('hidden');
    if (openChatBtn) {
      openChatBtn.classList.add('is-background');
      openChatBtn.classList.remove('is-glow');
    }
  }

  async function startChatFlow() {
    showChatPopup();
    if (chatStarted) return;
    chatStarted = true;
    chatLog.scrollTop = 0;
    await typeTextIntoBubble(initialBotBubble, 'Sorry to see your transaction declined, what happened?', 22);
    revealReasonOptions();
  }

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (roundInProgress) return;
      if (chatLog) {
        chatLog.classList.add('keep-sticky-actions');
        chatLog.classList.add('has-user-scrolled');
      }
      const reason = getSelectedReason();
      submitReasonBtn.disabled = !reason || reason === 'other';
      otherWrap.style.display = reason === 'other' ? 'flex' : 'none';
      if (reason === 'other') {
        otherInput.placeholder = 'Please tell us what happened';
      }
      reasonActions.style.display = reason && reason !== 'other' ? 'flex' : 'none';
      reasonBox.classList.toggle('other-input-active', reason === 'other');
      if (reason && reason !== 'other') {
        placeReasonActionsAfterSelection();
      } else {
        restoreReasonActionsPosition();
      }
    });
  });

  submitReasonBtn.addEventListener('click', async () => {
    if (roundInProgress) return;
    const reason = getSelectedReason();
    if (!reason || reason === 'other') return;

    roundInProgress = true;
    submitReasonBtn.disabled = true;
    radios.forEach((radio) => {
      radio.disabled = true;
    });
    const label = radios.find(r => r.value === reason).parentElement.textContent.trim();
    selectedReasonValue = reason;
    addBubble(label, 'user');
    reasonActions.style.display = 'none';
    selectedReasons.add(reason);
    hideUsedReason(reason);

    if (reason === 'trust_payment_flow') {
      await handleTrustPaymentFlow();
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (reason === 'network_timeout') {
      await handleNetworkDeviceIssueFlow();
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (reason === 'did_not_understand_interface') {
      await addTypingBotBubble(
        'Please click on the "How to Pay" button on the checkout page for step-by-step guidance.',
        20
      );
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (reason === 'missing_upi_apps') {
      await addTypingBotBubble('Which UPI app do you use that is missing from our list?', 20);
      chatLog.appendChild(reasonBox);
      chatLog.scrollTop = chatLog.scrollHeight;
      awaitingMissingUpiAppDetail = true;
      showTrustFollowupInputOnly();
      otherWrap.style.display = 'flex';
      otherInput.disabled = false;
      otherInput.value = '';
      otherInput.placeholder = 'Please enter app name';
      sendOtherBtn.disabled = false;
      sendOtherBtn.style.display = 'inline-flex';
      otherInput.focus();
      return;
    }

    if (reason === 'other_apps_button_not_working') {
      await handleOtherAppsButtonFlow();
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (reason === 'app_opened_closed_immediately') {
      await handleAppOpenedClosedFlow();
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (reason === 'bank_block') {
      await handleBankBlockedFlow();
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (reason === 'multiple_redirects_confusing') {
      await handleMultipleRedirectsFlow();
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (reason === 'technical_error') {
      const isComplete = await handleTechnicalErrorFlow();
      if (isComplete) {
        endReasonSelection();
        await finishConversation();
      }
      return;
    }

    await addTypingBotBubble(responses[reason], 20);
    endReasonSelection();
    await finishConversation();
  });

  sendOtherBtn.addEventListener('click', async () => {
    if (roundInProgress && !awaitingTechnicalOtherDetail && !awaitingMissingUpiAppDetail) return;
    const text = otherInput.value.trim();
    if (!text) return;

    roundInProgress = true;
    radios.forEach((radio) => {
      radio.disabled = true;
    });
    sendOtherBtn.disabled = true;
    addBubble(text, 'user');

    if (awaitingTechnicalOtherDetail) {
      awaitingTechnicalOtherDetail = false;
      await addTypingBotBubble('We will try our best to resolve your issue.', 24);
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (awaitingMissingUpiAppDetail) {
      awaitingMissingUpiAppDetail = false;
      await addTypingBotBubble("We're working on adding this payment app.", 24);
      await addTypingBotBubble('Noted, we will try to resolve your issue soon', 24);
      endReasonSelection();
      await finishConversation();
      return;
    }

    if (!selectedReasons.has('other')) {
      selectedReasons.add('other');
      hideUsedReason('other');
      selectedReasonValue = 'other';
    }
    await completeReasonFlow('Thank you for letting us know, we will quickly try to resolve your issue.');
  });

  otherInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendOtherBtn.click();
    }
  });

  function scheduleAutoOpen() {
    if (autoOpenTimerId || chatStarted) return;
    autoOpenTimerId = setTimeout(() => {
      startChatFlow();
      autoOpenTimerId = null;
    }, 1500);
  }

  (function initChat() {
    setupPopupControls();
    setupMobileStickyReveal();
    if (document.readyState === 'complete') {
      scheduleAutoOpen();
      return;
    }
    window.addEventListener('load', scheduleAutoOpen, { once: true });
  })();
})();
