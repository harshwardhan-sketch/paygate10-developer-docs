
  document.addEventListener("DOMContentLoaded", function () {
    // Mobile Wallet accordion initialization can be added here if needed
  });


  
  // Handle cancel button click - show feedback modal
  function handleCancelClick() {
    const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    feedbackModal.show();
  }

  // Prevent background scrolling when feedback modal is open (especially on mobile)
  let scrollPosition = 0;
  document.addEventListener('DOMContentLoaded', function() {
    const feedbackModalElement = document.getElementById('feedbackModal');
    if (feedbackModalElement) {
      // When modal is shown, prevent background scrolling
      feedbackModalElement.addEventListener('show.bs.modal', function() {
        // Save current scroll position
        scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        
        // Prevent scrolling on both body and html for better mobile support
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollPosition}px`;
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
      });

      // When modal is hidden, restore background scrolling
      feedbackModalElement.addEventListener('hidden.bs.modal', function() {
        // Restore scrolling on both body and html
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        
        // Restore scroll position after styles are cleared
        requestAnimationFrame(function() {
          window.scrollTo(0, scrollPosition);
          scrollPosition = 0;
        });
      });
    }
  });

  // Handle feedback modal radio button changes
  document.addEventListener('DOMContentLoaded', function() {
    const feedbackOptions = document.querySelectorAll('input[name="feedbackOption"]');
    const conditionalOptions = document.getElementById('conditionalOptions');
    
    feedbackOptions.forEach(option => {
      option.addEventListener('change', function() {
        // Remove error message when any option is selected
        const existingError = document.querySelector('.feedback-error');
        if (existingError) {
          existingError.remove();
        }
        
        if (this.value === 'no_option' && this.checked) {
          // Show conditional options when "no_option" is selected
          if (conditionalOptions) {
            conditionalOptions.classList.remove('d-none');
          }
        } else {
          // Hide conditional options when other options are selected
          if (conditionalOptions) {
            conditionalOptions.classList.add('d-none');
          }
          // Uncheck any selected payment options
          const paymentOptions = document.querySelectorAll('input[name="paymentOption"]');
          paymentOptions.forEach(opt => opt.checked = false);
        }
      });
    });

    // Also remove error message when payment options are selected
    document.addEventListener('change', function(e) {
      if (e.target.name === 'paymentOption') {
        const existingError = document.querySelector('.feedback-error');
        if (existingError) {
          existingError.remove();
        }
      }
    });

    // Handle submit button click with validation
    const submitFeedbackBtn = document.getElementById('submitFeedback');
    if (submitFeedbackBtn) {
      submitFeedbackBtn.addEventListener('click', function() {
        const selectedFeedback = document.querySelector('input[name="feedbackOption"]:checked');
        const selectedPayment = document.querySelector('input[name="paymentOption"]:checked');
        
        // Remove any existing error message
        const existingError = document.querySelector('.feedback-error');
        if (existingError) {
          existingError.remove();
        }
        
        // Get current language
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        
        // Check if any feedback option is selected
        if (!selectedFeedback) {
          const errorMessage = translations[currentLang] && translations[currentLang]['feedback-error'] 
            ? translations[currentLang]['feedback-error'] 
            : 'Please select an option to submit your feedback';
          showFeedbackError(errorMessage);
          return;
        }
        
        // If "no_option" is selected, check if a payment option is also selected
        if (selectedFeedback.value === 'no_option' && !selectedPayment) {
          const errorMessage = translations[currentLang] && translations[currentLang]['feedback-error'] 
            ? translations[currentLang]['feedback-error'] 
            : 'Please select an option to submit your feedback';
          showFeedbackError(errorMessage);
          return;
        }
        
        // If validation passes, proceed with submission
        console.log('Feedback submitted:', {
          feedback: selectedFeedback.value,
          payment: selectedPayment ? selectedPayment.value : null
        });
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
        if (modal) {
          modal.hide();
        }
      });
    }
  });

  // Function to show error message
  function showFeedbackError(message) {
    const modalBody = document.querySelector('#feedbackModal .modal-body');
    const existingError = document.querySelector('.feedback-error');
    
    if (existingError) {
      existingError.remove();
    }
    
    if (modalBody) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'feedback-error text-danger mt-2';
      errorDiv.textContent = message;
      
      modalBody.appendChild(errorDiv);
    }
  }


  // Function to handle payment confirmation
  function confirmPayment() {
    hideError('pinRetryError');
    hideError('pinMaxAttemptsError');
    
    const pinInput = document.getElementById('pinInput');
    if (pinInput && pinInput.value.trim() !== '') {
      // Simulate PIN validation (you can replace this with actual validation logic)
      const isCorrectPIN = validatePIN(pinInput.value);
      
      if (isCorrectPIN) {
        console.log('Payment confirmed with PIN:', pinInput.value);
        // Store PIN in sessionStorage for OTP page
        sessionStorage.setItem('pinEntered', pinInput.value);
        // Navigate to OTP page
        window.location.href = 'otp-page.html';
      } else {
        // Handle wrong PIN
        handleWrongPIN();
      }
    }
  }

  // Function to validate PIN (simulate validation)
  function validatePIN(pin) {
    // For demo purposes, assume PIN "1234" is correct
    // In real implementation, this would validate against stored PIN
    return pin === "1234";
  }

  // Function to handle wrong PIN attempts
  function handleWrongPIN() {
    let attempts = parseInt(sessionStorage.getItem('pinAttempts') || '0');
    attempts++;
    sessionStorage.setItem('pinAttempts', attempts);
    
    const attemptsRemaining = 3 - attempts;
    const attemptsRemainingElement = document.getElementById('attemptsRemaining');
    
    if (attemptsRemainingElement) {
      attemptsRemainingElement.textContent = attemptsRemaining;
    }
    
    if (attempts >= 3) {
      // Show maximum attempts reached message
      hideError('pinRetryError');
      showError('pinMaxAttemptsError');
      
      // Show message for 2 seconds before proceeding
      setTimeout(() => {
        console.log('Maximum PIN attempts reached, proceeding to OTP page');
        sessionStorage.setItem('pinEntered', 'max_attempts_reached');
        window.location.href = 'otp-page.html';
      }, 2000);
    } else {
      // Show retry error message
      showError('pinRetryError');
      // Clear PIN input for next attempt and disable button
      const pinInput = document.getElementById('pinInput');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
        // Update button state to disabled since input is now empty
        updatePinButton();
      }
    }
  }

  // Function to go back to payment page
  function goBack() {
    window.location.href = 'index.html';
  }

  // Function to go back to PIN page
  function goBackToPin() {
    window.location.href = 'pin-page.html';
  }

  // Function to show error message
  function showError(errorId, customMessage = null) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.classList.remove('d-none');
      if (customMessage) {
        // Handle pinRetryError specially to preserve attempts remaining
        if (errorId === 'pinRetryError') {
          const attemptsSpan = errorElement.querySelector('#attemptsRemaining');
          if (attemptsSpan) {
            const attemptsValue = attemptsSpan.textContent;
            const textSpan = errorElement.querySelector('span[data-translate="pin-retry-error"]');
            if (textSpan) {
              textSpan.textContent = customMessage;
            }
            // Keep attempts span value
            attemptsSpan.textContent = attemptsValue;
          }
        } else {
          const textSpan = errorElement.querySelector('span:last-child');
          if (textSpan && !textSpan.id) {
            textSpan.textContent = customMessage;
          } else {
            // Fallback if structure doesn't have span
            const translateSpan = errorElement.querySelector('span[data-translate]');
            if (translateSpan) {
              translateSpan.textContent = customMessage;
            } else {
              errorElement.textContent = customMessage;
            }
          }
        }
      }
    }
    
    // Add red border to corresponding input/select field
    const fieldMap = {
      'pinRetryError': 'pinInput',
      'pinMaxAttemptsError': 'pinInput',
      'otpError': 'otpInput'
    };
    
    const fieldId = fieldMap[errorId];
    if (fieldId) {
      const fieldElement = document.getElementById(fieldId);
      if (fieldElement) {
        fieldElement.classList.add('form-control-error');
      }
    }
  }

  // Function to hide error message
  function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.classList.add('d-none');
    }
    
    // Remove red border from corresponding input/select field
    const fieldMap = {
      'pinRetryError': 'pinInput',
      'pinMaxAttemptsError': 'pinInput',
      'otpError': 'otpInput'
    };
    
    const fieldId = fieldMap[errorId];
    if (fieldId) {
      const fieldElement = document.getElementById(fieldId);
      if (fieldElement) {
        fieldElement.classList.remove('form-control-error');
      }
    }
  }


  // Function to verify OTP
  function verifyOTP() {
    hideError('otpError');
    const otpInput = document.getElementById('otpInput');
    if (otpInput && otpInput.value.trim() !== '') {
      console.log('OTP verified:', otpInput.value);
      // Add your OTP verification logic here
      // You can redirect to a success page or show a success message
    } else {
      showError('otpError');
    }
  }



  // Function to load card details on PIN page
  function loadCardDetails() {
    const cardNumber = sessionStorage.getItem('cardNumber');
    const expiryDate = sessionStorage.getItem('expiryDate');
    const paymentAmount = sessionStorage.getItem('paymentAmount');
    const transactionDate = sessionStorage.getItem('transactionDate');
    
    if (cardNumber) {
      const cardNumberDisplay = document.querySelector('.card-number-display');
      if (cardNumberDisplay) {
        cardNumberDisplay.textContent = `Card Number: ${cardNumber}`;
      }
    }
    
    if (transactionDate) {
      const transactionDateDisplay = document.querySelector('.transaction-date');
      if (transactionDateDisplay) {
        transactionDateDisplay.textContent = `Transaction Date: ${transactionDate}`;
      }
    }
    
    if (paymentAmount) {
      const amountDisplay = document.querySelector('.payment-amount');
      if (amountDisplay) {
        amountDisplay.textContent = `Amount: ${paymentAmount}`;
      }
    }
  }

  // Load card details when PIN page or OTP page loads
  document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('pin-page.html')) {
      loadCardDetails();
      resetPINAttempts();
      // Initialize PIN input for button state management
      initializePinInput();
      
      // Focus on PIN input field
      setTimeout(() => {
        const pinInput = document.getElementById('pinInput');
        if (pinInput) {
          pinInput.focus();
        }
      }, 100);
    } else if (window.location.pathname.includes('otp-page.html')) {
      loadCardDetails();
      // Initialize OTP input for button state management
      initializeOtpInput();
      
      // Focus on OTP input field
      setTimeout(() => {
        const otpInput = document.getElementById('otpInput');
        if (otpInput) {
          otpInput.focus();
        }
      }, 100);
    } else if (window.location.pathname.includes('index.html')) {
      // Mobile Wallet page initialization can be added here if needed
    }
  });

  // Function to reset PIN attempts when PIN page loads
  function resetPINAttempts() {
    sessionStorage.setItem('pinAttempts', '0');
  }


  // Function to open How to Pay popup
function openHowToPayPopup() {
  const popup = document.getElementById('howToPayPopup');
  if (popup) {
    popup.classList.remove('d-none');
    document.body.classList.add('popup-open'); // Add class to prevent background scrolling
  }
}

  // Function to close How to Pay popup
function closeHowToPayPopup() {
  const popup = document.getElementById('howToPayPopup');
  if (popup) {
    popup.classList.add('d-none');
    document.body.classList.remove('popup-open'); // Remove class to restore background scrolling
  }
}

  // Close popup when Escape key is pressed
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeHowToPayPopup();
    }
  });

  // Function to validate phone number
  function validatePhoneNumber(phoneNumber) {
    const trimmed = phoneNumber.trim();
    // Check if Easypaisa number starts with 03 and has exactly 11 digits total (03 + 9 more)
    return trimmed.startsWith('03') && trimmed.length === 11 && /^03\d{9}$/.test(trimmed);
  }




  // Function to update PIN button state based on input
  function updatePinButton() {
    const pinInput = document.getElementById('pinInput');
    const pinButton = document.querySelector('button[onclick="confirmPayment()"]');
    
    if (pinInput && pinButton) {
      const pinValue = pinInput.value.trim();
      pinButton.disabled = pinValue === '';
      
      // Hide retry error when user starts typing again
      if (pinValue !== '') {
        hideError('pinRetryError');
      }
    }
  }

  // Function to update OTP button state based on input
  function updateOtpButton() {
    const otpInput = document.getElementById('otpInput');
    const otpButton = document.querySelector('button[onclick="verifyOTP()"]');
    
    if (otpInput && otpButton) {
      const otpValue = otpInput.value.trim();
      otpButton.disabled = otpValue === '';
    }
  }

  // Function to initialize PIN input for button state management
  function initializePinInput() {
    const pinInput = document.getElementById('pinInput');
    
    if (pinInput) {
      pinInput.addEventListener('input', updatePinButton);
      
      // Add input listener to hide retry error when PIN becomes valid
      pinInput.addEventListener('input', function() {
        const pinValue = this.value.trim();
        if (pinValue.length >= 4) {
          hideError('pinRetryError');
        }
      });
      
      // Initialize button state on page load
      updatePinButton();
    }
  }

  // Function to initialize OTP input for button state management
  function initializeOtpInput() {
    const otpInput = document.getElementById('otpInput');
    
    if (otpInput) {
      otpInput.addEventListener('input', updateOtpButton);
      
      // Add input listener to hide error when OTP becomes valid
      otpInput.addEventListener('input', function() {
        const otpValue = this.value.trim();
        if (otpValue.length > 0) {
          hideError('otpError');
        }
      });
      
      // Initialize button state on page load
      updateOtpButton();
    }
  }

  // Translation dictionary
  const translations = {
    en: {
      'expires-in': 'Expires in:',
      'complete-payment': 'Complete your payment',
      'phone-number': 'Phone Number',
      'easypaisa-number': 'Easypaisa Number',
      'jazzcash-wallet': 'JazzCash Wallet',
      'jazzcash-number': 'JazzCash Number',
      'valid-phone': 'Please enter a valid phone number',
      'valid-easypaisa-number': 'Please enter a valid Easypaisa number',
      'valid-jazzcash-number': 'Please enter a valid JazzCash number',
      'payment-instructions': 'Payment Instructions',
      'pay-amount': 'Pay KES 500',
      'pay-amount-pkr': 'Pay PKR 500',
      'order-id': 'Order ID',
      'cancel': 'Cancel',
      'pay-mastercard-visa': 'Pay using Mastercard or Visa',
      'card-number': 'Enter Your Card Number',
      'card-number-error': 'Please enter a valid Mastercard or Visa card number',
      'expiry-month': 'Expiry Month',
      'choose-month': 'Choose Month',
      'expiry-month-error': 'Please select expiry month',
      'expiry-year': 'Expiry Year',
      'choose-year': 'Choose Year',
      'expiry-year-error': 'Please select expiry year',
      'cvv': 'CVV',
      'cvv-error': 'Please enter CVV',
      'cvv-tooltip': 'CVV is 3 digits found on back of card',
      'proceed-to-pay': 'Proceed to Pay',
      'enter-card-pin': 'Enter your card PIN',
      'transaction-details': 'Transaction Details',
      'amount': 'Amount',
      'card-number-display': 'Card Number',
      'enter-pin-label': 'PIN',
      'enter-pin-placeholder': 'Enter card PIN',
      'pin-error': 'Please enter PIN',
      'pin-retry-error': 'Invalid PIN. Please try again. Attempts left:',
      'pin-max-attempts-error': 'Maximum retry attempts reached.',
      'submit-pin': 'Submit PIN',
      'otp-verification': 'OTP Verification',
      'otp-label': 'OTP',
      'otp-placeholder': 'Enter OTP to verify',
      'otp-error': 'Please enter OTP',
      'verify-otp': 'Verify OTP',
      'session-expire': 'Your Session will expire in',
      'account-number': 'Account Number',
      'jazzcash-number': 'JazzCash Number',
      'waiting-payment': 'Waiting for payment approval',
      'notification-instruction': 'Haven\'t received a notification? Open your Easypaisa App, and authorize the payment by entering PIN to complete the payment.',
      'notification-instruction-jazzcash': 'Haven\'t received a notification? Open your JazzCash wallet app, and authorize the payment by approving the payment request.',
      'return-home': 'Return to Home',
      'mobile-money': 'Mobile Money',
      'mobile-money-operator': 'Mobile Money Operator',
      'select-telecom-network': 'Select telecom network',
      'phone-number-placeholder': '254XXXXXXXXX',
      'select-mobile-money-operator': 'Please select a Mobile Money Operator',
      'note': 'Note:',
      'mobile-money-notification-instruction': 'Haven\'t received a notification? Open your mobile money app, and authorize the payment by entering the PIN to complete the payment.',
      'mobile-money-tanzania': 'Mobile Money',
      'mobile-money-operator-tanzania': 'Mobile Money Operator',
      'select-telecom-network-tanzania': 'Select telecom network',
      'phone-number-placeholder-tanzania': '255XXXXXXXXX',
      'select-mobile-money-operator-tanzania': 'Please select a Mobile Money Operator',
      'pay-amount-tanzania': 'Pay TZS 500.00',
      'feedback': 'Feedback',
      'feedback-explore': 'I would like to explore more before completing transaction.',
      'feedback-dont-understand': 'I didn\'t understand what to do next.',
      'feedback-edit-details': 'I want to go back and edit my details.',
      'feedback-changed-mind': 'I changed my mind.',
      'skip': 'Skip',
      'submit-feedback': 'Submit Feedback',
      'feedback-error': 'Please select an option to submit your feedback',
      'mobile-wallet': 'Mobile Wallet',
      'continue': 'Continue',
      'how-to-pay': 'How to pay?',
      'how-to-pay-instruction': 'You will need to pay the exact amount, then enter your payment details and upload proof to verify.',
      'wallet-details-for-payment': 'Wallet Details for Payment',
      'enter-payment-details': 'Enter Payment Details',
      'copy': 'Copy',
      'copied': 'Copied!',
      'enter-wallet-number': 'Enter your wallet number',
      'please-add-attachment': 'Please add an attachment',
      'transaction-reference-id': 'Transaction Reference ID',
      'enter-transaction-ref-id': 'Enter your Transaction Ref ID',
      'upload-receipt': 'Upload Receipt',
      'max-upload-size': 'Max upload size: 5MB',
      'supported-file-format': 'Supported File Format: .jpg, .JPEG, and .png',
      'submit': 'Submit',
      'valid-wallet-number': 'Enter a valid wallet number',
      'valid-transaction-ref-id': 'Enter a valid transaction reference ID',
      'submission-successful': 'Submission Successful',
      'submission-message': 'Your bank account details have been received successfully. We\'re processing your request and will complete it shortly.',
      'return-to-home': 'Return to Home',
      'mobile-wallet-dropdown-label': 'Mobile Wallet',
      'wallet-number': 'Wallet Number',
      'wallet-name': 'Wallet Name',
      'select-wallet-app': 'Select your wallet app',
      'transfer-details': 'Your Account Details',
      'enter-wallet-name': 'Enter your wallet name',
      'valid-wallet-name': 'Enter a valid wallet name',
      'bank-transfer': 'Bank Transfer',
      'bank-dropdown-label': 'Bank',
      'select-bank': 'Select your bank',
      'bank-account-details-for-payment': 'Beneficiary details',
      'bank-account-number': 'Bank Account Number',
      'bank-account-name': 'Bank Account Name',
      'enter-account-number': 'Enter your account number',
      'enter-account-name': 'Enter your account name',
      'valid-account-number': 'Enter a valid account number (Length must be 24 digits)',
      'valid-account-name': 'Enter a valid account name',
      'payment-completion-title': '⚠️ Complete the transfer in your Bank Website/App using the beneficiary details displayed',
      'payment-completion-message': 'After making the payment in your Bank Website/App, please provide the below details:',
      'payment-completion-detail-1': 'Bank account details (bank account number and bank account name) from which the transfer was made',
      'payment-completion-detail-2': 'Proof of payment (receipt/screenshot)',
      'got-it': 'Got it'
    },
    ur: {
      'expires-in': 'ختم ہونے کا وقت',
      'complete-payment': 'اپنی ادائیگی مکمل کریں',
      'phone-number': 'فون نمبر',
      'easypaisa-number': 'ایزی پیسہ نمبر',
      'easypaisa-wallet': 'ایزی پیسہ والیٹ',
      'jazzcash-wallet': 'جاز کیش والیٹ',
      'jazzcash-number': 'جاز کیش نمبر',
      'valid-phone': 'براہ کرم درست فون نمبر درج کریں',
      'valid-easypaisa-number': 'براہ کرم درست ایزی پیسہ نمبر درج کریں',
      'valid-jazzcash-number': 'براہ کرم درست جاز کیش نمبر درج کریں',
      'payment-instructions': 'ادائیگی کی ہدایات',
      'easypaisa-wallet': 'ایزی پیسہ والیٹ',
      'pay-amount': 'Lipa KES 500',
      'pay-amount-pkr': 'PKR 500 ادا کریں',
      'order-id': 'آرڈر آئی ڈی',
      'cancel': 'منسوخ',
      'pay-mastercard-visa': 'ماسٹرکارڈ یا ویزا استعمال کرکے ادا کریں',
      'card-number': 'کارڈ نمبر',
      'card-number-error': 'براہ کرم درست ماسٹرکارڈ یا ویزا کارڈ نمبر درج کریں',
      'expiry-month': 'ختم ہونے والا مہینہ',
      'choose-month': 'مہینہ منتخب کریں',
      'expiry-month-error': 'براہ کرم ختم ہونے والا مہینہ منتخب کریں',
      'expiry-year': 'ختم ہونے والا سال',
      'choose-year': 'سال منتخب کریں',
      'expiry-year-error': 'براہ کرم ختم ہونے والا سال منتخب کریں',
      'cvv': 'CVV',
      'cvv-error': 'براہ کرم CVV درج کریں',
      'cvv-tooltip': 'CVV کارڈ کے پیچھے 3 ہندسے ہیں',
      'proceed-to-pay': 'ادائیگی کے لیے آگے بڑھیں',
      'enter-card-pin': 'اپنا کارڈ PIN درج کریں',
      'transaction-details': 'ٹرانزیکشن کی تفصیلات',
      'amount': 'رقم',
      'card-number-display': 'کارڈ نمبر',
      'enter-pin-label': 'PIN',
      'enter-pin-placeholder': 'کارڈ PIN درج کریں',
      'pin-error': 'براہ کرم PIN درج کریں',
      'pin-retry-error': 'غلط PIN۔ براہ کرم دوبارہ کوشش کریں۔ باقی کوششیں:',
      'pin-max-attempts-error': 'زیادہ سے زیادہ دوبارہ کوششیں پوری ہو گئیں۔',
      'submit-pin': 'PIN جمع کروائیں',
      'otp-verification': 'OTP کی تصدیق',
      'otp-label': 'OTP',
      'otp-placeholder': 'تصدیق کے لیے OTP درج کریں',
      'otp-error': 'براہ کرم OTP درج کریں',
      'verify-otp': 'OTP کی تصدیق کریں',
      'session-expire': 'آپ کا سیشن ختم ہو جائے گا',
      'account-number': 'اکاؤنٹ نمبر',
      'waiting-payment': 'ادائیگی کی منظوری کا انتظار',
      'notification-instruction': 'کیا آپ کو نوٹیفیکیشن موصول نہیں ہوا؟ اپنا Easypaisa ایپ کھولیں، اور ادائیگی مکمل کرنے کے لیے PIN درج کرکے ادائیگی کی منظوری دیں۔',
      'notification-instruction-jazzcash': 'کوئی اطلاع موصول نہیں ہوئی ؟ اپنا ایزی پیسہ والیٹ ایپ کھولیں ، اور ادائیگی کی درخواست کی منظوری دے کر ادائیگی کی اجازت دیں ۔',
      'return-home': 'ہوم پر واپس جائیں',
      'mobile-money': 'موبائل منی',
      'mobile-money-operator': 'موبائل منی آپریٹر',
      'select-telecom-network': 'ٹیلی کام نیٹ ورک منتخب کریں',
      'phone-number-placeholder': '03XXXXXXXXX',
      'select-mobile-money-operator': 'براہ کرم موبائل منی آپریٹر منتخب کریں',
      'note': 'نوٹ:',
      'mobile-money-notification-instruction': 'کیا آپ کو نوٹیفیکیشن موصول نہیں ہوا؟ اپنی موبائل منی ایپ کھولیں، اور ادائیگی مکمل کرنے کے لیے PIN درج کرکے ادائیگی کی منظوری دیں۔',
      'feedback': 'فیڈ بیک',
      'feedback-explore': 'میں لین دین مکمل کرنے سے پہلے مزید تلاش کرنا چاہتا/چاہتی ہوں۔',
      'feedback-dont-understand': 'مجھے سمجھ نہیں آیا کہ اگلا کیا کرنا ہے۔',
      'feedback-edit-details': 'میں واپس جا کر اپنی تفصیلات میں ترمیم کرنا چاہتا/چاہتی ہوں۔',
      'feedback-changed-mind': 'میں نے اپنا ارادہ تبدیل کر لیا ہے۔',
      'skip': 'چھوڑ دیں',
      'submit-feedback': 'فیڈ بیک جمع کروائیں',
      'feedback-error': 'براہ کرم اپنی فیڈ بیک جمع کرانے کے لیے ایک آپشن منتخب کریں',
      'mobile-money-tanzania': 'موبائل منی',
      'mobile-money-operator-tanzania': 'موبائل منی آپریٹر',
      'select-telecom-network-tanzania': 'ٹیلی کام نیٹ ورک منتخب کریں',
      'phone-number-placeholder-tanzania': '255XXXXXXXXX',
      'select-mobile-money-operator-tanzania': 'براہ کرم موبائل منی آپریٹر منتخب کریں',
      'pay-amount-tanzania': 'TZS 500.00 ادا کریں',
      'mobile-wallet': 'موبائل والیٹ',
      'continue': 'آگے بڑھیں',
      'how-to-pay': 'ادائیگی کا طریقہ؟',
      'how-to-pay-instruction': 'صحيح رقم ادا کریں، ادائیگی کی تفصیلات درج کریں اور ثبوت اپ لوڈ کریں۔',
      'how-to-pay-instruction-urdu': 'آپ کو درست رقم ادا کرنی ہوگی، پھر اپنی ادائیگی کی تفصیلات درج کریں اور تصدیق کے لیے ثبوت اپ لوڈ کریں۔',
      'wallet-details-for-payment': 'ادائیگی کے لیے والیٹ کی تفصیلات',
      'enter-payment-details': 'ادائیگی کی تفصیلات درج کریں',
      'copy': 'کاپی',
      'wallet-number': 'والیٹ نمبر',
      'enter-wallet-number': 'اپنا والیٹ نمبر درج کریں',
      'please-add-attachment': 'براہ کرم ایک منسلکہ شامل کریں',
      'copied': 'کاپی ہو گیا!',
      'transaction-reference-id': 'ٹرانزیکشن ریفرنس آئی ڈی',
      'enter-transaction-ref-id': 'اپنا ٹرانزیکشن ریفرنس درج کریں',
      'upload-receipt': 'رسید اپ لوڈ کریں',
      'max-upload-size': 'یادہ سے زیادہ اپ لوڈ سائز : 5MB',
      'supported-file-format': 'سپورٹ شدہ فائل فارمیٹ: .jpg، .JPEG، اور .png',
      'submit': 'جمع کریں',
      'valid-wallet-number': 'درست والیٹ نمبر درج کریں',
      'valid-transaction-ref-id': 'درست ٹرانزیکشن ریفرنس آئی ڈی درج کریں',
      'submission-successful': 'جمع کرانے کا عمل کامیاب ہو گیا',
      'submission-message': 'آپ کی بینک اکاؤنٹ کی تفصیلات کامیابی سے موصول ہو گئی ہیں۔ ہم آپ کی درخواست پر کارروائی کر رہے ہیں اور جلد ہی اسے مکمل کر دیا جائے گا۔',
      'return-to-home': 'واپس',
      'mobile-wallet-dropdown-label': 'موبائل والیٹ',
      'wallet-name': 'والیٹ نام',
      'select-wallet-app': 'اپنی والیٹ ایپ منتخب کریں',
      'transfer-details': 'ٹرانسفر کی تفصیلات',
      'enter-wallet-name': 'اپنا والیٹ نام درج کریں',
      'valid-wallet-name': 'درست والیٹ نام درج کریں',
      'bank-transfer': 'بینک ٹرانسفر',
      'bank-dropdown-label': 'بینک',
      'select-bank': 'اپنا بینک منتخب کریں',
      'bank-account-details-for-payment': 'ادائیگی کے لیے بینک اکاؤنٹ کی تفصیلات',
      'bank-account-number': 'بینک اکاؤنٹ نمبر',
      'bank-account-name': 'بینک اکاؤنٹ نام',
      'enter-account-number': 'اپنا اکاؤنٹ نمبر درج کریں',
      'enter-account-name': 'اپنا اکاؤنٹ نام درج کریں',
      'valid-account-number': 'درست اکاؤنٹ نمبر درج کریں (لمبائی 24 ہندسے ہونی چاہیے)',
      'valid-account-name': 'درست اکاؤنٹ نام درج کریں',
      'payment-completion-title': '⚠️ اپنی بینک ویب سائٹ/ایپ میں ٹرانسفر مکمل کریں',
      'payment-completion-message': 'اپنی بینک ویب سائٹ/ایپ میں ادائیگی کرنے کے بعد، براہ کرم درج ذیل تفصیلات فراہم کریں:',
      'payment-completion-detail-1': 'بینک اکاؤنٹ کی تفصیلات (بینک اکاؤنٹ نمبر اور بینک اکاؤنٹ نام جہاں سے ٹرانسفر کیا گیا)',
      'payment-completion-detail-2': 'ادائیگی کا ثبوت (رسید/اسکرین شاٹ)',
      'got-it': 'سمجھ گیا'
    },
    ar: {
      'expires-in': 'الوقت غادي يسالي:',
      'complete-payment': 'كمل الخسارة ديالك',
      'order-id': 'رقم الطلب',
      'cancel': 'إلغاء',
      'how-to-pay': 'كيفاش تدفع',
      'how-to-pay-instruction': 'غادي تحتاج تدفع المبلغ بالضبط، من بعد تدخل معلومات الدفع ديالك وتحمّل الدليل للتحقق.',
      'wallet-details-for-payment': 'تفاصيل المحفظة للدفع',
      'wallet-number': 'رقم المحفظة',
      'wallet-name': 'اسم المحفظة',
      'amount': 'مبلغ',
      'copy': 'نسخ',
      'copied': 'تم النسخ!',
      'enter-payment-details': 'أدخل تفاصيل الدفع',
      'enter-wallet-number': 'دخل رقم المحفظة ديالك',
      'transaction-reference-id': 'رقم مرجع المعاملة',
      'enter-transaction-ref-id': 'أدخل رقم مرجع المعاملة الخاص بك',
      'upload-receipt': 'رفع القيتعة',
      'max-upload-size': 'أعلى حجم التحميل',
      'submit': 'إرسال',
      'valid-wallet-number': 'أدخل رقم محفظة صحيح',
      'valid-transaction-ref-id': 'أدخل رقم مرجع معاملة صحيح',
      'submission-successful': 'إرسال بنجاح',
      'submission-message': 'تفاصيل الحساب البنكي تقدمو بنجاح. حنا كنعالجو الطلب ديالك وغادي نكملوه قصر.',
      'return-to-home': 'رجع',
      'feedback': 'ملاحظات',
      'feedback-explore': 'أود استكشاف المزيد قبل إتمام المعاملة.',
      'feedback-dont-understand': 'لم أفهم ما يجب فعله بعد ذلك.',
      'feedback-edit-details': 'أريد العودة وتعديل تفاصيلي.',
      'feedback-changed-mind': 'غيرت رأيي.',
      'skip': 'تخطي',
      'submit-feedback': 'إرسال الملاحظات',
      'select-wallet-app': 'اختار تطبيق المحفظة ديالك',
      'mobile-wallet-dropdown-label': 'محفظة الهاتف المحمول',
      'payment-instructions': 'إرشادات الدفع',
      'continue': 'تابع',
      'transfer-details': 'تفاصيل النقل',
      'enter-wallet-name': 'دخل اسم المحفظة ديالك',
      'valid-wallet-name': 'دخل اسم محفظة صحيح',
      'supported-file-format': 'صيغ الملفات المدعومة: .jpg، .JPEG، و .png',
      'bank-transfer': 'تحويل بنكي',
      'bank-dropdown-label': 'بنك',
      'select-bank': 'اختار بنك ديالك',
      'bank-account-details-for-payment': 'تفاصيل حساب البنك للمدفوعات',
      'bank-account-number': 'رقم حساب البنك',
      'bank-account-name': 'اسم الحساب البنكي',
      'enter-account-number': 'دخل رقم الحساب ديالك',
      'enter-account-name': 'دخل اسم الحساب ديالك',
      'valid-account-number': 'دخل رقم حساب صحيح (الطول خاصو يكون 24 رقم)',
      'valid-account-name': 'دخل اسم حساب صحيح',
      'payment-completion-title': '⚠️ كمل التحويل فموقع/تطبيق البنك ديالك',
      'payment-completion-message': 'من بعد ما تدير الأداء فموقع/تطبيق البنك ديالك، عطينا المعلومات ديال تحت:',
      'payment-completion-detail-1': 'تفاصيل حساب البنك (رقم حساب البنك واسم حساب البنك اللي خرج منها التحويل)',
      'payment-completion-detail-2': 'دليل الأداء (وصل أو سكرينشوت)',
      'got-it': 'فهمت'
    },
    fr: {
      'expires-in': 'Expire dans :',
      'complete-payment': 'Finalisez votre paiement',
      'payment-instructions': 'Instructions de paiement',
      'mobile-wallet': 'Portefeuille mobile',
      'mobile-wallet-dropdown-label': 'Portefeuille mobile',
      'wallet-details-for-payment': 'Détails du portefeuille pour le paiement',
      'wallet-number': 'Numéro du portefeuille',
      'wallet-name': 'Nom du portefeuille',
      'amount': 'Montant',
      'copy': 'Copier',
      'copied': 'Copié !',
      'continue': 'Continuer',
      'enter-wallet-number': 'Saisissez votre numéro de portefeuille',
      'valid-wallet-number': 'Entrez un numéro de portefeuille valide',
      'order-id': 'ID de commande',
      'cancel': 'Annuler',
      'how-to-pay': 'Comment payer ?',
      'submit': 'Soumettre',
      'feedback': 'Retour',
      'feedback-explore': 'Je souhaite explorer davantage avant de finaliser la transaction.',
      'feedback-dont-understand': "Je n'ai pas compris ce qu'il fallait faire ensuite.",
      'feedback-edit-details': 'Je veux revenir en arrière et modifier mes informations.',
      'feedback-changed-mind': "J'ai changé d'avis.",
      'skip': 'Ignorer',
      'submit-feedback': 'Envoyer le retour',
      'select-wallet-app': 'Sélectionnez votre application de portefeuille',
      'transfer-details': 'Détails du transfert',
      'enter-wallet-name': 'Saisissez le nom de votre portefeuille',
      'valid-wallet-name': 'Entrez un nom de portefeuille valide',
      'upload-receipt': 'Télécharger le reçu',
      'max-upload-size': 'Taille maximale du fichier : 5 MB',
      'supported-file-format': 'Formats de fichier pris en charge : .jpg, .JPEG et .png',
      'submission-successful': 'Soumission réussie',
      'submission-message': 'Les coordonnées de votre compte bancaire ont été reçues avec succès. Nous traitons votre demande et la finaliserons sous peu.',
      'return-to-home': 'Retour à l\'accueil',
      'bank-transfer': 'Virement bancaire',
      'bank-dropdown-label': 'Banque',
      'select-bank': 'Sélectionnez votre banque',
      'bank-account-details-for-payment': 'Coordonnées du compte bancaire pour le paiement',
      'bank-account-number': 'Numéro de compte bancaire',
      'bank-account-name': 'Nom du compte bancaire',
      'enter-account-number': 'Saisissez votre numéro de compte',
      'enter-account-name': 'Saisissez le nom de votre compte',
      'valid-account-number': 'Entrez un numéro de compte valide (la longueur doit être de 24 chiffres)',
      'valid-account-name': 'Entrez un nom de compte valide',
      'payment-completion-title': '⚠️ Complétez le transfert sur votre site/app bancaire',
      'payment-completion-message': 'Après avoir effectué le paiement sur votre site/app bancaire, veuillez fournir les détails ci-dessous :',
      'payment-completion-detail-1': 'Coordonnées bancaires (numéro de compte bancaire et nom du compte à partir duquel le transfert a été effectué)',
      'payment-completion-detail-2': 'Preuve de paiement (reçu / capture d\'écran)',
      'got-it': 'Compris'
    }
  };

  // Copy wallet number function (used on multiple pages)
  function copyWalletNumber(event) {
    const walletNumberElement = document.getElementById('recipientWalletNumber');
    if (!walletNumberElement) {
      return;
    }
    const walletNumber = walletNumberElement.textContent;
    navigator.clipboard.writeText(walletNumber).then(function() {
      const copyButton = event.target.closest('.copy-button-simple');
      if (copyButton) {
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        const spanElement = copyButton.querySelector('span');
        if (!spanElement) {
          return;
        }
        const originalText = spanElement.textContent;

        let copiedText = 'Copied!';
        if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang]['copied']) {
          copiedText = translations[currentLang]['copied'];
        }

        spanElement.textContent = copiedText;
        setTimeout(() => {
          if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang]['copy']) {
            spanElement.textContent = translations[currentLang]['copy'];
          } else {
            spanElement.textContent = originalText;
          }
        }, 2000);
      }
    }).catch(function(err) {
      console.error('Failed to copy text: ', err);
    });
  }

  // Copy bank account number function
  function copyBankAccountNumber(event) {
    const bankAccountNumberElement = document.getElementById('recipientBankAccountNumber');
    if (!bankAccountNumberElement) {
      return;
    }
    const bankAccountNumber = bankAccountNumberElement.textContent;
    navigator.clipboard.writeText(bankAccountNumber).then(function() {
      const copyButton = event.target.closest('.copy-button-simple');
      if (copyButton) {
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        const spanElement = copyButton.querySelector('span');
        if (!spanElement) {
          return;
        }
        const originalText = spanElement.textContent;

        let copiedText = 'Copied!';
        if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang]['copied']) {
          copiedText = translations[currentLang]['copied'];
        }

        spanElement.textContent = copiedText;
        setTimeout(() => {
          if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang]['copy']) {
            spanElement.textContent = translations[currentLang]['copy'];
          } else {
            spanElement.textContent = originalText;
          }
        }, 2000);
      }
    }).catch(function(err) {
      console.error('Failed to copy text: ', err);
    });
  }

  // Function to switch language
  function switchLanguage(lang) {
    if (!lang) {
      console.error('switchLanguage called without language parameter');
      return;
    }
    
    if (!translations || !translations[lang]) {
      console.error('Translations not found for language:', lang);
      return;
    }
    
    const languagePills = document.querySelectorAll('.language-pill');
    const paymentInstructionsTexts = document.querySelectorAll('.payment-instructions-text');
    const paymentInstructionsTextsUrdu = document.querySelectorAll('.payment-instructions-text-urdu');
    const paymentInstructionsTextsArabic = document.querySelectorAll('.payment-instructions-text-arabic');
    const paymentInstructionsTextsFrench = document.querySelectorAll('.payment-instructions-text-french');
    const htmlElement = document.documentElement;
    
    // Update direction based on language
    if (lang === 'ur' || lang === 'ar') {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', lang);
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', lang === 'fr' ? 'fr' : 'en');
    }
    
    // Update active state for language pills
    languagePills.forEach(pill => {
      const pillLang = pill.getAttribute('data-lang');
      if (pillLang === lang) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    
    // Translate all elements with data-translate attribute
    const translatableElements = document.querySelectorAll('[data-translate]');
    translatableElements.forEach(element => {
      const key = element.getAttribute('data-translate');
      if (translations[lang] && translations[lang][key]) {
        // Handle elements with nested spans (like error messages with dynamic content)
        if (element.id === 'pinRetryError' && element.querySelector('#attemptsRemaining')) {
          const attemptsSpan = element.querySelector('#attemptsRemaining');
          const attemptsValue = attemptsSpan.textContent;
          const translatedText = translations[lang][key];
          element.innerHTML = translatedText + ' <span id="attemptsRemaining">' + attemptsValue + '</span>';
        } else if (element.tagName === 'OPTION') {
          // For option elements, update text content
          element.textContent = translations[lang][key];
        } else if (element.tagName === 'BUTTON') {
          // For button elements, update text content
          element.textContent = translations[lang][key];
        } else if (element.classList.contains('selected-text')) {
          // For custom dropdown selected text
          element.textContent = translations[lang][key];
        } else if (element.classList.contains('custom-dropdown-option')) {
          // For custom dropdown options
          element.textContent = translations[lang][key];
        } else {
          // For other elements (labels, spans, etc.), update text content
          element.textContent = translations[lang][key];
        }
      }
    });
    
    // Translate input placeholders with data-translate-placeholder attribute
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-translate-placeholder');
      if (translations[lang] && translations[lang][key]) {
        element.placeholder = translations[lang][key];
      }
    });
    
    // Show/hide language-specific text in payment instructions
    if (lang === 'en') {
      paymentInstructionsTexts.forEach(text => {
        text.style.display = 'block';
      });
      paymentInstructionsTextsUrdu.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsArabic.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsFrench.forEach(text => {
        text.style.display = 'none';
      });
    } else if (lang === 'ur') {
      paymentInstructionsTexts.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsUrdu.forEach(text => {
        text.style.display = 'block';
      });
      paymentInstructionsTextsArabic.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsFrench.forEach(text => {
        text.style.display = 'none';
      });
    } else if (lang === 'ar') {
      paymentInstructionsTexts.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsUrdu.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsArabic.forEach(text => {
        text.style.display = 'block';
      });
      paymentInstructionsTextsFrench.forEach(text => {
        text.style.display = 'none';
      });
    } else if (lang === 'fr') {
      paymentInstructionsTexts.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsUrdu.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsArabic.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsFrench.forEach(text => {
        text.style.display = 'block';
      });
    }
    
    // Update custom dropdown placeholder if no value is selected
    const bankSelected = document.getElementById('bankDropdownSelected');
    if (bankSelected && !bankSelected.classList.contains('has-value')) {
      const selectedText = bankSelected.querySelector('.selected-text');
      if (selectedText && translations[lang] && translations[lang]['select-bank']) {
        selectedText.textContent = translations[lang]['select-bank'];
      }
    }
    
    // Save selected language to sessionStorage
    sessionStorage.setItem('selectedLanguage', lang);

    // Keep selected bank display stable across language switches
    restoreSelectedBankFromStorage();
  }
  
  // Make switchLanguage available globally
  window.switchLanguage = switchLanguage;

  // Restore selected bank in custom dropdown from sessionStorage
  function restoreSelectedBankFromStorage() {
    const savedBankValue = sessionStorage.getItem('selectedBankValue');
    if (!savedBankValue) {
      return;
    }

    const bankSelected = document.getElementById('bankDropdownSelected');
    const bankSelect = document.getElementById('bankSelect');
    const continueButton = document.getElementById('continueButton');
    const displayedBankName = document.getElementById('displayedBankName');
    const selectedText = bankSelected ? bankSelected.querySelector('.selected-text') : null;
    const optionEl = document.querySelector(`#bankDropdownOptions .custom-dropdown-option[data-value="${savedBankValue}"]`);

    if (!bankSelected || !selectedText || !optionEl) {
      return;
    }

    const bankName = optionEl.textContent.trim();
    const logoImg = optionEl.querySelector('.bank-logo');

    selectedText.textContent = '';
    if (logoImg) {
      selectedText.appendChild(logoImg.cloneNode(true));
    }
    const bankNameSpan = document.createElement('span');
    bankNameSpan.textContent = bankName;
    selectedText.appendChild(bankNameSpan);

    bankSelected.classList.add('has-value');
    if (bankSelect) {
      bankSelect.value = savedBankValue;
    }
    if (displayedBankName) {
      displayedBankName.textContent = bankName;
    }
    if (continueButton) {
      continueButton.disabled = false;
    }
    sessionStorage.setItem('selectedBankName', bankName);
  }

  // Navigate to wallet details page with selected bank context
  function goToWalletDetails() {
    const bankSelect = document.getElementById('bankSelect');
    const selectedOption = bankSelect ? bankSelect.options[bankSelect.selectedIndex] : null;
    const selectedBankName = selectedOption && selectedOption.value ? selectedOption.textContent.trim() : 'Bank of Africa';
    const selectedBankValue = selectedOption && selectedOption.value ? selectedOption.value : '';

    sessionStorage.setItem('selectedBankName', selectedBankName);
    if (selectedBankValue) {
      sessionStorage.setItem('selectedBankValue', selectedBankValue);
    }
    sessionStorage.setItem('recipientBankAccountNumber', '123456789012345678901234');
    window.location.href = 'wallet-details.html';
  }

  window.goToWalletDetails = goToWalletDetails;

  // Custom Bank Dropdown Functionality
  document.addEventListener('DOMContentLoaded', function() {
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/html-upi/') || window.location.pathname.endsWith('/html-upi');
    if (isIndexPage) {
      // Reset dropdown selection on full page reload/navigation to index
      sessionStorage.removeItem('selectedBankValue');
      sessionStorage.removeItem('selectedBankName');
    }

    const bankSelected = document.getElementById('bankDropdownSelected');
    const bankOptions = document.getElementById('bankDropdownOptions');
    const bankSelect = document.getElementById('bankSelect');
    const bankOptionElements = document.querySelectorAll('#bankDropdownOptions .custom-dropdown-option');

    if (bankSelected && bankOptions) {
      // Toggle dropdown on click
      bankSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        bankOptions.classList.toggle('show');
        bankSelected.classList.toggle('active');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!bankSelected.contains(e.target) && !bankOptions.contains(e.target)) {
          bankOptions.classList.remove('show');
          bankSelected.classList.remove('active');
        }
      });

      // Handle option selection
      bankOptionElements.forEach(option => {
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          const value = this.getAttribute('data-value');
          const text = this.textContent.trim();
          const continueButton = document.getElementById('continueButton');
          const displayedBankName = document.getElementById('displayedBankName');
          const bankAccountDetailsSection = document.getElementById('bankAccountDetailsSection');

          if (value === '') {
            // Reset to placeholder - use translated text
            const currentLang = document.documentElement.getAttribute('lang') || 'en';
            const placeholderText = translations && translations[currentLang] && translations[currentLang]['select-bank'] 
              ? translations[currentLang]['select-bank'] 
              : 'Select your bank';
            const selectedText = bankSelected.querySelector('.selected-text');
            selectedText.textContent = placeholderText;
            // Remove any existing logo
            const existingLogo = selectedText.querySelector('.bank-logo');
            if (existingLogo) {
              existingLogo.remove();
            }
            bankSelected.classList.remove('has-value');
            if (bankSelect) {
              bankSelect.value = '';
            }
            // Reset displayed bank name to default
            if (displayedBankName) {
              displayedBankName.textContent = 'Bank of Africa';
            }
            // Hide bank account details section
            if (bankAccountDetailsSection) {
              bankAccountDetailsSection.classList.add('d-none');
            }
            // Disable Continue button
            if (continueButton) {
              continueButton.disabled = true;
            }
            sessionStorage.removeItem('selectedBankValue');
            sessionStorage.removeItem('selectedBankName');
          } else {
            // Get the logo from the selected option
            const logoImg = this.querySelector('.bank-logo');
            const selectedText = bankSelected.querySelector('.selected-text');
            
            // Clear existing content
            selectedText.textContent = '';
            
            // Add logo if it exists
            if (logoImg) {
              const logoClone = logoImg.cloneNode(true);
              selectedText.appendChild(logoClone);
            }
            
            // Add bank name text
            const bankNameSpan = document.createElement('span');
            bankNameSpan.textContent = text;
            selectedText.appendChild(bankNameSpan);
            
            bankSelected.classList.add('has-value');
            if (bankSelect) {
              bankSelect.value = value;
            }
            // Update displayed bank name to match selected bank
            if (displayedBankName) {
              displayedBankName.textContent = text;
            }
            // Show bank account details section
            if (bankAccountDetailsSection) {
              bankAccountDetailsSection.classList.remove('d-none');
            }
            // Enable Continue button
            if (continueButton) {
              continueButton.disabled = false;
            }
            sessionStorage.setItem('selectedBankValue', value);
            sessionStorage.setItem('selectedBankName', text);
          }

          // Close dropdown
          bankOptions.classList.remove('show');
          bankSelected.classList.remove('active');
        });
      });
    }

  });