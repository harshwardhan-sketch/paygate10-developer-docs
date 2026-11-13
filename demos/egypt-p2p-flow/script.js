
  document.addEventListener("DOMContentLoaded", function () {
    // Mobile Wallet accordion initialization can be added here if needed
  });

  function trackEvent(eventName, properties, options) {
    if (typeof analytics === 'undefined' || typeof analytics.track !== 'function') {
      return;
      //Note: add a log so we see in the console when debugging that analytics is not initialize rather than failing silently
    }
    if (options) {
      analytics.track(eventName, properties || {}, options);
      return;
    }
    analytics.track(eventName, properties || {});
  }

  function getTrackedOrderId() {
    const selectors = [
      '#orderIdDisplay',
      '#exampleModal .long-text',
      '.modal-body .long-text'
    ];
    for (let i = 0; i < selectors.length; i++) {
      const orderIdEl = document.querySelector(selectors[i]);
      if (!orderIdEl) {
        continue;
      }
      const value = (orderIdEl.textContent || '').trim();
      if (!value) {
        continue;
      }
      sessionStorage.setItem('trackedOrderId', value);
      return value;
    }
    return sessionStorage.getItem('trackedOrderId') || '';
  }

  function getTrackedPageName() {
    if (document.body && document.body.classList.contains('upi-qr-page')) {
      return 'upi-qr';
    }
    if (document.body && document.body.classList.contains('ph-qr-page')) {
      return 'ph-qr';
    }
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/HTML/') || window.location.pathname.endsWith('/HTML')) {
      return 'checkout';
    }
    const pathName = (window.location.pathname.split('/').pop() || '').replace('.html', '');
    return pathName || 'checkout';
  }

  function getPaymentMethodLabel(appKey) {
    const appKeyMap = {
      paytm: 'Paytm',
      phonepe: 'PhonePe',
      gpay: 'Google Pay',
      bhim: 'BHIM',
      cred: 'CRED',
      navi: 'Navi',
      supermoney: 'Super.money',
      amazonpay: 'Amazon Pay'
    };
    return appKeyMap[appKey] || appKey || '';
  }

  function getLanguageLabel(langCode) {
    const labels = {
      en: 'English',
      ar: 'Arabic',
      ur: 'Urdu',
      fr: 'French',
      hi: 'Hindi',
      bn: 'Bangla',
      zu: 'Zulu',
      xh: 'Xhosa',
      af: 'Afrikaans',
      yo: 'Yoruba',
      ig: 'Igbo',
      ha: 'Hausa',
      tl: 'Tagalog'
    };
    return labels[langCode] || langCode;
  }

  function getLangCodeFromPill(pill) {
    if (!pill) {
      return '';
    }
    const langFromData = pill.getAttribute('data-lang');
    if (langFromData) {
      return langFromData;
    }
    const text = (pill.textContent || '').trim();
    if (text === 'हिंदी' || text === 'Hindi') {
      return 'hi';
    }
    if (text === 'English') {
      return 'en';
    }
    return '';
  }

  function trackSwitchLanguageEvent(langCode) {
    if (!langCode) {
      return;
    }
    // event: Switch Language
    trackEvent('Switch Language', {
      Language: getLanguageLabel(langCode),
      order_id: getTrackedOrderId()
    });
  }

  function bindLanguagePillTracking() {
    const pills = document.querySelectorAll('.language-pill');
    pills.forEach((pill) => {
      if (pill.dataset.langBound === '1') {
        return;
      }
      pill.dataset.langBound = '1';
      pill.addEventListener('click', function() {
        const langCode = getLangCodeFromPill(pill);
        trackSwitchLanguageEvent(langCode);
      });
    });
  }

  // India UPI QR: redirect to QR page (India flow)
  function handleShowQRClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sessionStorage.removeItem('upiQrFlow');
    // No analytics tracking for the default India merchant UPI flow; only the ALT flow is tracked
    window.location.href = 'upi-qr-page.html';
  }

  // UPI (India) flow: redirect to QR page with flow-specific layout flags
  function handleAltShowQRClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sessionStorage.setItem('upiQrFlow', 'alt');
    // event: Show QR (UPI (India) flow: provider: 'alt' isolates this click from the default merchant UPI flow)
    trackEvent('Show QR', { page: 'checkout', provider: 'alt', order_id: getTrackedOrderId() });
    window.location.href = 'upi-qr-page.html';
  }

  // UPI (India) flow: detect ALT flow on upi-qr-page.html
  function isAltUpiQrFlow() {
    return sessionStorage.getItem('upiQrFlow') === 'alt';
  }

  // UPI (India) flow: detect ALT flow for click-driven events, which can also fire from the
  // checkout accordion (index.html) before sessionStorage's upiQrFlow flag is set on navigation to the QR page.
  function isAltUpiInteraction(target) {
    if (document.body && document.body.classList.contains('upi-qr-page')) {
      return isAltUpiQrFlow();
    }
    return !!(target && target.closest && target.closest('#collapseALTUPIQR'));
  }

  // UPI (India) flow: swap handle logos, mobile app rows, and hide merchant header on upi-qr-page.html
  function configureUpiQrPageHandlesLogos() {
    if (!document.body || !document.body.classList.contains('upi-qr-page')) {
      return;
    }
    const isAlt = isAltUpiQrFlow();
    const defaultLogos = document.getElementById('upiHandlesLogosDefault');
    const altLogos = document.getElementById('upiHandlesLogosAlt');
    const defaultMobileMethods = document.getElementById('mobileUpiMethodsDefault');
    const altMobileMethods = document.getElementById('mobileUpiMethodsAlt');
    if (defaultLogos) {
      defaultLogos.classList.toggle('d-none', isAlt);
    }
    if (altLogos) {
      altLogos.classList.toggle('d-none', !isAlt);
    }
    if (defaultMobileMethods) {
      defaultMobileMethods.classList.toggle('d-none', isAlt);
    }
    if (altMobileMethods) {
      altMobileMethods.classList.toggle('d-none', !isAlt);
    }
    // UPI (India) flow: body class hides merchant logo header on upi-qr-page.html
    document.body.classList.toggle('upi-qr-page--alt', isAlt);
  }

  window.handleAltShowQRClick = handleAltShowQRClick;
  window.configureUpiQrPageHandlesLogos = configureUpiQrPageHandlesLogos;

  const PHILIPPINES_QRPH_IMAGE_PATH = 'images/QRPH.png';
  const PHILIPPINES_QRPH_DOWNLOAD_NAME = 'qrph-payment-qr.png';
  let philippinesQrphDownloadObjectUrl = null;

  function preparePhilippinesQrphDownloadLink() {
    const qrImage = document.getElementById('phQrCodeImage') || document.getElementById('philippinesQrphQRCode');
    const downloadLink = document.getElementById('phQrDownloadButton') || document.getElementById('philippinesQrphDownloadQRButton');
    if (!qrImage || !downloadLink) {
      return;
    }

    const applyBlobUrl = (blob) => {
      if (!blob) {
        return;
      }
      if (philippinesQrphDownloadObjectUrl) {
        URL.revokeObjectURL(philippinesQrphDownloadObjectUrl);
      }
      philippinesQrphDownloadObjectUrl = URL.createObjectURL(blob);
      downloadLink.href = philippinesQrphDownloadObjectUrl;
      downloadLink.setAttribute('download', PHILIPPINES_QRPH_DOWNLOAD_NAME);
    };

    const cacheFromLoadedImage = () => {
      const width = qrImage.naturalWidth;
      const height = qrImage.naturalHeight;
      if (!width || !height) {
        return false;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          return false;
        }
        context.drawImage(qrImage, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            applyBlobUrl(blob);
          }
        }, 'image/png');
        return true;
      } catch (error) {
        return false;
      }
    };

    if (cacheFromLoadedImage()) {
      return;
    }

    const resolvedImageUrl = new URL(PHILIPPINES_QRPH_IMAGE_PATH, window.location.href).href;
    fetch(resolvedImageUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('QR image fetch failed');
        }
        return response.blob();
      })
      .then(applyBlobUrl)
      .catch(() => {
        const retryFromImage = () => {
          if (!cacheFromLoadedImage()) {
            downloadLink.href = PHILIPPINES_QRPH_IMAGE_PATH;
            downloadLink.setAttribute('download', PHILIPPINES_QRPH_DOWNLOAD_NAME);
          }
        };
        if (qrImage.complete) {
          retryFromImage();
        } else {
          qrImage.addEventListener('load', retryFromImage, { once: true });
        }
      });
  }

  function handlePhilippinesQrphShowQRClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sessionStorage.setItem('paymentMethod', 'philippines-qrph');
    window.location.href = 'ph-qr-page.html';
  }

  window.handlePhilippinesQrphShowQRClick = handlePhilippinesQrphShowQRClick;
  window.preparePhilippinesQrphDownloadLink = preparePhilippinesQrphDownloadLink;

  // India UPI QR: open supported apps via deep links
  const UPI_APP_LINKS = {
    gpay: { scheme: 'tez://upi/pay?pa=merchant@upi&pn=Merchant&cu=INR' },
    bhim: { scheme: 'bhim://' },
    paytm: { scheme: 'paytmmp://' },
    phonepe: { scheme: 'phonepe://pay' },
    cred: { scheme: 'credpay://' },
    navi: { schemes: ['navipay://', 'navi://'] },
    supermoney: { schemes: ['supermoney://', 'super.money://'] },
    amazonpay: { schemes: ['amazonpay://', 'amazon://'] }
  };

  function attemptOpenUpiNativeApp(appKey, isAlt) {
    const links = UPI_APP_LINKS[appKey];
    if (!links) {
      return;
    }
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const startHref = window.location.href;
    let didBackgroundOrBlur = false;
    let blurStartedAt = 0;
    let appOpened = false;

    const showUpiAppNotFoundMessage = function() {
      const existing = document.getElementById('appNotFoundMessage');
      if (existing) {
        existing.remove();
      }
      const messageDiv = document.createElement('div');
      messageDiv.id = 'appNotFoundMessage';
      messageDiv.className = 'alert alert-danger text-center position-fixed start-50 translate-middle-x mb-3';
      messageDiv.style.zIndex = '9999';
      messageDiv.style.bottom = '20px';
      messageDiv.style.left = '50%';
      messageDiv.style.transform = 'translateX(-50%)';
      messageDiv.style.width = 'min(720px, calc(100vw - 24px))';
      messageDiv.style.whiteSpace = 'normal';
      messageDiv.style.overflowWrap = 'anywhere';
      messageDiv.style.paddingLeft = '16px';
      messageDiv.style.paddingRight = '16px';
      const activeLang = document.documentElement.getAttribute('lang') || sessionStorage.getItem('selectedLanguage') || 'en';
      const localizedMessage = (translations[activeLang] && translations[activeLang]['upi-app-not-found']) ||
        (translations.en && translations.en['upi-app-not-found']) ||
        'This app was not found, please choose another app';
      messageDiv.textContent = localizedMessage;
      // event: App Not Found Toast (UPI (India) flow: only the ALT flow is tracked)
      if (isAlt) {
        trackEvent('App Not Found Toast', {
          page: getTrackedPageName(),
          method: getPaymentMethodLabel(appKey),
          order_id: getTrackedOrderId(),
          provider: 'alt'
        });
      }
      document.body.appendChild(messageDiv);
      setTimeout(() => {
        const el = document.getElementById('appNotFoundMessage');
        if (el) {
          el.remove();
        }
      }, 2500);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        didBackgroundOrBlur = true;
        appOpened = true;
      }
    };
    const onBlur = () => {
      didBackgroundOrBlur = true;
      blurStartedAt = Date.now();
      if (isAndroid) {
        appOpened = true;
      }
      setTimeout(() => {
        if (document.hidden) {
          appOpened = true;
        }
      }, 60);
    };
    const onFocus = () => {
      if (isIOS && !appOpened && blurStartedAt) {
        const awayMs = Date.now() - blurStartedAt;
        if (awayMs > 700) {
          appOpened = true;
        }
      }
    };
    const onPageHide = () => {
      didBackgroundOrBlur = true;
      appOpened = true;
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);

    const schemes = Array.isArray(links.schemes) ? links.schemes : (links.scheme ? [links.scheme] : []);
    if (!schemes.length) {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pagehide', onPageHide);
      return;
    }
    try {
      if (isIOS) {
        window.location.href = schemes[0];
        if (schemes[1]) {
          setTimeout(() => {
            if (!didBackgroundOrBlur && !appOpened) {
              window.location.href = schemes[1];
            }
          }, 280);
        }
      } else {
        window.location.href = schemes[0];
        if (schemes[1]) {
          setTimeout(() => {
            if (!didBackgroundOrBlur) {
              window.location.href = schemes[1];
            }
          }, 220);
        }
      }
    } catch (_) {
      // Ignore deep-link failures
    }

    const detectionDelayMs = isIOS ? 1800 : 400;
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
      const stillVisible = !document.hidden;
      const samePage = window.location.href === startHref;
      if (!appOpened && !didBackgroundOrBlur && stillVisible && samePage) {
        showUpiAppNotFoundMessage();
      } else if (appOpened) {
        // event: Payment Method App Opened (UPI (India) flow: only the ALT flow is tracked)
        if (isAlt) {
          trackEvent('Payment Method App Opened', {
            page: getTrackedPageName(),
            method: getPaymentMethodLabel(appKey),
            order_id: getTrackedOrderId(),
            provider: 'alt'
          });
        }
      }
    }, detectionDelayMs);
  }

  const EGYPT_TELECOM_PROVIDERS = {
    etisalat: {
      id: 'etisalat',
      prefix: '011',
      ussdCode: '*777*55#',
      logo: 'images/et.png',
      logoAlt: 'e& money - EG',
      appSchemes: null,
      iosLaunchMode: 'iframe',
      storeUrls: null
    },
    orange: {
      id: 'orange',
      prefix: '012',
      ussdCode: '#710#',
      logo: 'images/or.png',
      logoAlt: 'Orange',
      appSchemes: null,
      iosLaunchMode: 'iframe',
      storeUrls: null
    },
    vodafone: {
      id: 'vodafone',
      prefix: '010',
      ussdCode: '*9*55#',
      logo: 'images/vo.png',
      logoAlt: 'Vodafone',
      appSchemes: null,
      iosLaunchMode: 'iframe',
      storeUrls: null
    },
    wecash: {
      id: 'wecash',
      prefix: '015',
      ussdCode: '*999*55#',
      logo: 'images/we.png',
      logoAlt: 'WE Cash',
      appSchemes: null,
      storeUrls: null,
      storeOnly: true
    }
  };

  function getEgyptTelecomProviderFromPhone(phoneNumber) {
    const digits = String(phoneNumber || '').replace(/\D/g, '');
    if (digits.startsWith('011')) {
      return EGYPT_TELECOM_PROVIDERS.etisalat;
    }
    if (digits.startsWith('012')) {
      return EGYPT_TELECOM_PROVIDERS.orange;
    }
    if (digits.startsWith('010')) {
      return EGYPT_TELECOM_PROVIDERS.vodafone;
    }
    if (digits.startsWith('015')) {
      return EGYPT_TELECOM_PROVIDERS.wecash;
    }
    return EGYPT_TELECOM_PROVIDERS.etisalat;
  }

  function getEgyptTelecomProviderFromSession() {
    const providerId = sessionStorage.getItem('egyptTelecomProvider');
    if (providerId && EGYPT_TELECOM_PROVIDERS[providerId]) {
      return EGYPT_TELECOM_PROVIDERS[providerId];
    }
    return getEgyptTelecomProviderFromPhone(sessionStorage.getItem('walletPhoneNumber') || '');
  }

  function getEgyptTelecomProviderConfig() {
    return getEgyptTelecomProviderFromSession();
  }

  function encodeUssdCodeForTelUri(ussdCode) {
    return 'tel:' + String(ussdCode || '').replace(/\*/g, '%2A').replace(/#/g, '%23');
  }

  function getEgyptUssdTelUri() {
    const cached = sessionStorage.getItem('egyptUssdCode');
    const provider = getEgyptTelecomProviderConfig();
    return encodeUssdCodeForTelUri(cached || (provider && provider.ussdCode));
  }

  function syncEgyptWalletAppUrlFromPage() {
    const params = new URLSearchParams(window.location.search);
    const queryKeys = ['egyptWalletAppUrl', 'walletAppUrl', 'wallet_redirect_url', 'redirect_url'];
    for (let i = 0; i < queryKeys.length; i++) {
      const value = (params.get(queryKeys[i]) || '').trim();
      if (value && isEgyptCustomAppScheme(value)) {
        sessionStorage.setItem('egyptWalletAppUrl', value);
        return value;
      }
    }
    return (sessionStorage.getItem('egyptWalletAppUrl') || '').trim();
  }

  function detectEgyptPlatform() {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      return 'ios';
    }
    if (/Android/i.test(ua)) {
      return 'android';
    }
    return 'other';
  }

  function getEgyptWalletStoreUrl(provider, platform) {
    if (!provider || !provider.storeUrls) {
      return null;
    }
    if (platform === 'ios') {
      return provider.storeUrls.ios;
    }
    if (platform === 'android') {
      return provider.storeUrls.android;
    }
    return provider.storeUrls.android || provider.storeUrls.ios;
  }

  function isEgyptCustomAppScheme(url) {
    if (!url) {
      return false;
    }
    if (/^intent:\/\//i.test(url)) {
      return true;
    }
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) && !/^https?:\/\//i.test(url);
  }

  function shouldUseIframeLaunch(platform, provider) {
    if (platform === 'android') {
      return true;
    }
    return platform === 'ios' && provider && provider.iosLaunchMode === 'iframe';
  }

  function launchEgyptCustomScheme(url, platform, provider) {
    if (!shouldUseIframeLaunch(platform, provider)) {
      window.location.href = url;
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'display:none;width:0;height:0;border:0;';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(function() {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1500);
  }

  function getEgyptSchemeDelayMs(platform, provider) {
    if (platform === 'ios' && provider && provider.iosLaunchMode === 'iframe') {
      return 325;
    }
    return platform === 'ios' ? 700 : 325;
  }

  function getEgyptStoreFallbackDelayMs(platform, schemeCount, provider) {
    const schemeDelayMs = getEgyptSchemeDelayMs(platform, provider);
    return platform === 'ios'
      ? schemeCount * schemeDelayMs + 1500
      : schemeCount * schemeDelayMs + 500;
  }

  let egyptWalletLaunchState = null;

  function cancelEgyptWalletLaunch() {
    if (!egyptWalletLaunchState) {
      return;
    }

    egyptWalletLaunchState.cancelled = true;
    egyptWalletLaunchState.timeouts.forEach(function(timeoutId) {
      clearTimeout(timeoutId);
    });
    egyptWalletLaunchState.timeouts = [];

    document.removeEventListener('visibilitychange', egyptWalletLaunchState.onVisibilityChange);
    window.removeEventListener('pagehide', egyptWalletLaunchState.onVisibilityChange);
    egyptWalletLaunchState = null;
  }

  function markEgyptWalletHandoff() {
    sessionStorage.setItem('egyptWalletAppHandoff', String(Date.now()));
    cancelEgyptWalletLaunch();
  }

  function hasEgyptWalletHandoff() {
    return sessionStorage.getItem('egyptWalletAppHandoff') !== null;
  }

  function scheduleEgyptWalletLaunch(callback, delay) {
    if (!egyptWalletLaunchState) {
      return null;
    }

    const timeoutId = setTimeout(function() {
      if (!egyptWalletLaunchState || egyptWalletLaunchState.cancelled || hasEgyptWalletHandoff()) {
        return;
      }
      callback();
    }, delay);

    egyptWalletLaunchState.timeouts.push(timeoutId);
    return timeoutId;
  }

  function isEgyptAppHandoffSuccessful() {
    return document.hidden || document.visibilityState === 'hidden';
  }

  function getEgyptWalletDeeplinkSchemes(provider, platform) {
    const customUrl = syncEgyptWalletAppUrlFromPage();
    let schemes = [];

    if (customUrl && isEgyptCustomAppScheme(customUrl)) {
      schemes.push(customUrl);
    }

    if (platform === 'ios' && provider.appSchemes && provider.appSchemes.ios) {
      schemes = schemes.concat(provider.appSchemes.ios);
    } else if (platform === 'android' && provider.appSchemes && provider.appSchemes.android) {
      schemes = schemes.concat(provider.appSchemes.android);
    }

    return schemes.filter(function(url, index, arr) {
      return isEgyptCustomAppScheme(url) && arr.indexOf(url) === index;
    });
  }

  function getEgyptNativeStoreUrl(storeUrl, platform) {
    if (!storeUrl) {
      return null;
    }

    if (platform === 'ios') {
      if (/^itms-apps:\/\//i.test(storeUrl)) {
        return storeUrl;
      }
      const appIdMatch = storeUrl.match(/\/id(\d+)/i);
      if (appIdMatch) {
        return 'itms-apps://itunes.apple.com/app/id' + appIdMatch[1];
      }
      return storeUrl.replace(/^https:\/\/apps\.apple\.com/i, 'itms-apps://itunes.apple.com');
    }

    if (platform === 'android') {
      const packageMatch = storeUrl.match(/[?&]id=([^&]+)/i);
      if (packageMatch) {
        return 'market://details?id=' + decodeURIComponent(packageMatch[1]);
      }
    }

    return storeUrl;
  }

  function redirectToEgyptWalletStore() {
    if (hasEgyptWalletHandoff()) {
      return;
    }

    const platform = detectEgyptPlatform();
    const provider = getEgyptTelecomProviderConfig();
    const storeUrl = getEgyptWalletStoreUrl(provider, platform);
    if (!storeUrl) {
      return;
    }

    const nativeStoreUrl = getEgyptNativeStoreUrl(storeUrl, platform) || storeUrl;
    window.location.assign(nativeStoreUrl);

    if (platform === 'android' && /^market:\/\//i.test(nativeStoreUrl)) {
      setTimeout(function() {
        if (hasEgyptWalletHandoff() || isEgyptAppHandoffSuccessful()) {
          return;
        }
        window.location.assign(storeUrl);
      }, 700);
    }
  }

  function attemptOpenEgyptWalletApp() {
    if (hasEgyptWalletHandoff()) {
      return;
    }

    cancelEgyptWalletLaunch();
    sessionStorage.removeItem('egyptWalletAppHandoff');

    const platform = detectEgyptPlatform();
    const provider = getEgyptTelecomProviderConfig();

    if (provider.storeOnly || platform === 'other') {
      redirectToEgyptWalletStore();
      return;
    }

    const schemes = getEgyptWalletDeeplinkSchemes(provider, platform);
    if (!schemes.length) {
      redirectToEgyptWalletStore();
      return;
    }

    const schemeDelayMs = getEgyptSchemeDelayMs(platform, provider);
    const launchState = {
      cancelled: false,
      storeRedirectStarted: false,
      timeouts: [],
      onVisibilityChange: function() {
        if (document.hidden || document.visibilityState === 'hidden') {
          markEgyptWalletHandoff();
        }
      }
    };

    egyptWalletLaunchState = launchState;
    document.addEventListener('visibilitychange', launchState.onVisibilityChange);
    window.addEventListener('pagehide', launchState.onVisibilityChange);

    function finishWithStoreRedirect() {
      if (
        !egyptWalletLaunchState
        || launchState.cancelled
        || launchState.storeRedirectStarted
        || hasEgyptWalletHandoff()
      ) {
        return;
      }

      launchState.storeRedirectStarted = true;
      cancelEgyptWalletLaunch();
      redirectToEgyptWalletStore();
    }

    function tryScheme(index) {
      if (!egyptWalletLaunchState || launchState.cancelled || hasEgyptWalletHandoff()) {
        return;
      }

      if (index >= schemes.length) {
        finishWithStoreRedirect();
        return;
      }

      const targetUrl = schemes[index];
      if (/^intent:\/\//i.test(targetUrl) && platform === 'android') {
        window.location.href = targetUrl;
      } else {
        launchEgyptCustomScheme(targetUrl, platform, provider);
      }

      scheduleEgyptWalletLaunch(function() {
        if (hasEgyptWalletHandoff() || isEgyptAppHandoffSuccessful()) {
          markEgyptWalletHandoff();
          return;
        }
        tryScheme(index + 1);
      }, schemeDelayMs);
    }

    tryScheme(0);

    scheduleEgyptWalletLaunch(function() {
      finishWithStoreRedirect();
    }, getEgyptStoreFallbackDelayMs(platform, schemes.length, provider));
  }

  function applyEgyptTelecomProviderUI() {
    const provider = getEgyptTelecomProviderConfig();
    const ussdLink = document.getElementById('egyptUssdCodeLink');
    const providerLogo = document.getElementById('egyptWalletProviderLogo');

    if (ussdLink && provider) {
      ussdLink.textContent = provider.ussdCode;
      ussdLink.setAttribute('href', getEgyptUssdTelUri());
      ussdLink.setAttribute('dir', 'ltr');
    }
    if (providerLogo && provider) {
      providerLogo.src = provider.logo;
      providerLogo.alt = provider.logoAlt;
    }
  }

  window.addEventListener('pageshow', function() {
    if (hasEgyptWalletHandoff()) {
      cancelEgyptWalletLaunch();
    }
  });

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && hasEgyptWalletHandoff()) {
      cancelEgyptWalletLaunch();
    }
  });

  syncEgyptWalletAppUrlFromPage();

  window.syncEgyptWalletAppUrlFromPage = syncEgyptWalletAppUrlFromPage;
  window.getEgyptTelecomProviderFromPhone = getEgyptTelecomProviderFromPhone;
  window.getEgyptTelecomProviderFromSession = getEgyptTelecomProviderFromSession;
  window.getEgyptTelecomProviderConfig = getEgyptTelecomProviderConfig;
  window.encodeUssdCodeForTelUri = encodeUssdCodeForTelUri;
  window.getEgyptUssdTelUri = getEgyptUssdTelUri;
  window.attemptOpenEgyptWalletApp = attemptOpenEgyptWalletApp;
  window.attemptOpenEtisalatEgyptApp = attemptOpenEgyptWalletApp;
  window.applyEgyptTelecomProviderUI = applyEgyptTelecomProviderUI;

  function validateUPIId(upiId) {
    const trimmed = upiId.trim();
    const upiPattern = /^.+@.+$/;
    return trimmed.length > 0 && upiPattern.test(trimmed);
  }

  function toggleUPIIdError(show) {
    const errorElement = document.getElementById('upiIdError');
    const inputElement = document.getElementById('upiIdInput');
    if (!errorElement || !inputElement) {
      return;
    }
    errorElement.classList.toggle('d-none', !show);
    inputElement.classList.toggle('form-control-error', show);
  }

  function initializeUPIInput() {
    const upiInput = document.getElementById('upiIdInput');
    const upiPayButton = document.getElementById('upiPayButton');
    const upiSpinner = document.getElementById('upiSpinner');
    const upiButtonText = document.getElementById('upiButtonText');
    if (!upiInput || !upiPayButton) {
      return;
    }

    const updateState = function() {
      const upiId = upiInput.value.trim();
      const isValid = validateUPIId(upiId);
      upiPayButton.disabled = !isValid;
      if (upiSpinner) {
        upiSpinner.classList.add('d-none');
      }
      if (upiButtonText && translations && translations.en && translations.en['pay-amount-inr']) {
        upiButtonText.textContent = translations.en['pay-amount-inr'];
      }
      if (isValid) {
        toggleUPIIdError(false);
      }
    };

    upiInput.addEventListener('input', updateState);
    upiInput.addEventListener('blur', function() {
      const upiId = upiInput.value.trim();
      toggleUPIIdError(upiId.length > 0 && !validateUPIId(upiId));
    });
    upiInput.addEventListener('focus', function() {
      const upiId = upiInput.value.trim();
      if (validateUPIId(upiId)) {
        toggleUPIIdError(false);
      }
    });

    upiPayButton.addEventListener('click', function() {
      const upiId = upiInput.value.trim();
      if (validateUPIId(upiId)) {
        sessionStorage.setItem('upiId', upiId);
      }
    });

    upiPayButton.disabled = true;
    if (upiSpinner) {
      upiSpinner.classList.add('d-none');
    }
  }

  function initializeIndiaNetBanking() {
    const netBankingCollapse = document.getElementById('collapseThree');
    const netBankingButton = document.getElementById('netBankingPayButton');
    const netBankingSelect = document.getElementById('netBankingSelect');
    if (!netBankingCollapse || !netBankingButton) {
      return;
    }

    const radioOptions = netBankingCollapse.querySelectorAll('input[name="indiaNetBankingRadio"]');
    const updateNetBankingButtonState = function() {
      const hasRadioSelection = Array.from(radioOptions).some((radio) => radio.checked);
      const hasDropdownSelection = !!(netBankingSelect && netBankingSelect.value);
      netBankingButton.disabled = !(hasRadioSelection || hasDropdownSelection);
    };

    radioOptions.forEach((radio) => {
      radio.addEventListener('change', function() {
        if (this.checked && netBankingSelect) {
          netBankingSelect.value = '';
        }
        updateNetBankingButtonState();
      });
    });

    if (netBankingSelect) {
      netBankingSelect.addEventListener('change', function() {
        if (this.value) {
          radioOptions.forEach((radio) => {
            radio.checked = false;
          });
        }
        updateNetBankingButtonState();
      });
    }

    netBankingButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    updateNetBankingButtonState();
  }

  
  // Handle cancel button click - show feedback modal
  function handleCancelClick() {
    // event: Cancel Click
    trackEvent('Cancel Click', {
      page: getTrackedPageName(),
      order_id: getTrackedOrderId()
    });
    const feedbackModalElement = document.getElementById('feedbackModal');
    if (!feedbackModalElement || typeof bootstrap === 'undefined' || !bootstrap.Modal) {
      return;
    }

    const onModalShown = function() {
      // event: Feedback Popup Opened
      trackEvent('Feedback Popup Opened', {
        page: getTrackedPageName(),
        order_id: getTrackedOrderId()
      });
      feedbackModalElement.removeEventListener('shown.bs.modal', onModalShown);
    };

    feedbackModalElement.addEventListener('shown.bs.modal', onModalShown);

    try {
      const feedbackModal = bootstrap.Modal.getOrCreateInstance(feedbackModalElement);
      feedbackModal.show();
    } catch (error) {
      feedbackModalElement.removeEventListener('shown.bs.modal', onModalShown);
    }
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
        // event: Feedback Option Selected
        trackEvent('Feedback Option Selected', {
          page: getTrackedPageName(),
          order_id: getTrackedOrderId(),
          feedback_option: this.value || ''
        });
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
        // event: Feedback Submit Click
        trackEvent('Feedback Submit Click', {
          page: getTrackedPageName(),
          order_id: getTrackedOrderId(),
          feedback_option: selectedFeedback ? selectedFeedback.value : ''
        });
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
      'otpError': 'otpBlocks'
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
      'otpError': 'otpBlocks'
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
      
      // Focus on first OTP digit field
      setTimeout(() => {
        const firstOtpInput = document.querySelector('.otp-digit-input');
        if (firstOtpInput) {
          firstOtpInput.focus();
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
    const otpDigitInputs = document.querySelectorAll('.otp-digit-input');

    if (otpButton) {
      let otpValue = '';
      if (otpDigitInputs.length) {
        otpValue = Array.from(otpDigitInputs).map((input) => input.value).join('');
        if (otpInput) {
          otpInput.value = otpValue;
        }
      } else if (otpInput) {
        otpValue = otpInput.value.trim();
      }
      const requiredLength = otpDigitInputs.length || 1;
      otpButton.disabled = otpValue.length < requiredLength;
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
    const otpDigitInputs = document.querySelectorAll('.otp-digit-input');

    if (otpDigitInputs.length) {
      otpDigitInputs.forEach((digitInput) => {
        digitInput.addEventListener('input', function() {
          const otpValue = Array.from(otpDigitInputs).map((input) => input.value).join('');
          if (otpInput) {
            otpInput.value = otpValue;
          }
          if (otpValue.length > 0) {
            hideError('otpError');
          }
          updateOtpButton();
        });
      });
    } else if (otpInput) {
      otpInput.addEventListener('input', updateOtpButton);
      otpInput.addEventListener('input', function() {
        const otpValue = this.value.trim();
        if (otpValue.length > 0) {
          hideError('otpError');
        }
      });
    }

    updateOtpButton();
  }

  // Payment method names that must stay in English in every language
  const ENGLISH_ONLY_TRANSLATION_KEYS = new Set([
    'mobile-wallets',
    'bank-transfer-method'
  ]);

  // Translation dictionary
  const translations = {
    en: {
      'expires-in': 'Expires in:',
      'complete-payment': 'Complete your payment',
      'phone-number': 'Phone Number',
      'easypaisa-number': 'Easypaisa Number',
      'easypaisa-wallet': 'Easypaisa Wallet',
      'jazzcash-wallet': 'JazzCash Wallet',
      'jazzcash-number': 'JazzCash Number',
      'valid-phone': 'Please enter a valid phone number',
      'ban-wallet-valid-mobile-number': 'Enter a valid mobile number (Must be 11 digits starting with 01)',
      'valid-easypaisa-number': 'Enter a valid Easypaisa number (Must be 11 digits starting with 03)',
      'valid-jazzcash-number': 'Please enter a valid JazzCash number',
      'payment-instructions': 'Payment Instructions',
      'bank-deposit': 'Bank Deposit',
      'instruction-1': 'Click "Show Bank Details" to generate your unique bank account number.',
      'instruction-2': 'Copy the account number from bank details and deposit exact amount within 30 minutes.',
      'instruction-3': 'Use your bank\'s mobile app or internet banking to make the transfer.',
      'show-bank-details': 'Show Bank Details',
      'bank-details': 'Bank Details',
      'account-name': 'Account Name:',
      'bank-name': 'Bank Name:',
      'bank-code': 'Bank Code:',
      'expiry-date': 'Expiry Date:',
      'download-pdf': 'Download PDF',
      'how-to-pay-instruction-1': 'Click on Copy button and copy the account number.',
      'how-to-pay-instruction-2': 'Deposit the exact amount shown above within 30 minutes to the copied account number.',
      'how-to-pay-instruction-3': 'Use your bank\'s mobile app or internet banking to make the transfer.',
      'how-to-pay-instruction-4': 'Transfers after the time limit or with a different amount will not be successful.',
      'how-to-pay-instruction-5': 'Your order will be confirmed automatically once payment is received.',
      'how-to-pay-instruction-6': 'Do not close or refresh this page.',
      'show-payment-details': 'Pay via Bank Transfer',
      'philippines-vca-send-payment-title': 'Send payment to this VCA number using banking app or portal',
      'philippines-vca-bank-transfer-method': 'Bank Transfer',
      'philippines-vca-label': 'Virtual Collection Account Number (VCA):',
      'philippines-vca-instruction-1': 'Click "Pay via Bank Transfer" to view the account number and use it to complete the transfer via your banking app or portal.',
      'philippines-vca-instruction-2': 'Open your preferred banking app or portal.',
      'philippines-vca-instruction-3': 'Select "Send Money" via InstaPay and choose "Other Banks or Wallets".',
      'philippines-vca-instruction-4': 'Enter the account details (Virtual Account Number) and exact amount shown at checkout.',
      'philippines-vca-instruction-5': 'Review the details and confirm the payment.',
      'philippines-vca-instruction-6': 'Once the payment is successful, your transaction status will be updated automatically.',
      'philippines-vca-important-label': 'Important:',
      'philippines-vca-important-text': 'The VCA number is unique to this transaction and should be used only for this payment.',
      'pay-amount': 'Pay KES 500',
      'pay-amount-pkr': 'Pay PKR 500.00',
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
      'otp-session-expires-in': 'OTP session expires in:',
      'otp-instruction': 'Enter the OTP sent to your Easypaisa number:',
      'otp-incorrect-error': 'Incorrect OTP. Please try again, you have 2 attempts left.',
      'easypaisa-number-label': 'Easypaisa number',
      'otp-label': 'OTP',
      'otp-placeholder': 'Enter OTP to verify',
      'otp-error': 'Please enter OTP',
      'verify-otp': 'Verify OTP',
      'submit-otp': 'Submit OTP',
      'session-expire': 'Your Session will expire in',
      'account-number': 'Account Number',
      'jazzcash-number': 'JazzCash Number',
      'waiting-payment': 'Waiting for payment approval',
      'notification-instruction': 'Haven\'t received a notification? Open your Easypaisa App, go to "My Account" and then approve the payment from "My Approvals".',
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
      'upi-qr-accordion-title': 'UPI QR',
      'upi-accordion-title': 'UPI',
      'upi-intent-accordion-title': 'UPI Intent',
      'upi-id': 'UPI ID',
      'upi-id-placeholder': 'username@ybl, username@paytm...',
      'valid-upi-id': 'Enter a valid UPI ID (e.g: name@bankhandle)',
      'pay-amount-inr': 'Pay INR 500',
      'scan-qr-instruction': 'Scan the QR using your UPI app and complete the payment within 5 mins.',
      'net-banking-accordion-title': 'Net Banking',
      'popular-banks': 'Popular Banks',
      'or-separator': 'or',
      'bank-label': 'Bank',
      'select-your-bank': 'Select your bank',
      'sbi-bank': 'State Bank Of India',
      'kotak-bank': 'Kotak Bank',
      'icici-bank': 'ICICI',
      'axis-bank': 'Axis Bank',
      'icici-bank-option': 'ICICI Bank',
      'federal-bank': 'Federal Bank',
      'hdfc-bank': 'HDFC Bank',
      'sbi-bank-option': 'State Bank of India',
      'pay-with-qr-code': 'Pay with QR code',
      'show-qr': 'Show QR',
      'we-support-upi': 'We support all UPI handles',
      'choose-payment-method': 'Choose any UPI supported app below to complete payment.',
      'how-to-pay-link': 'How to pay',
      'how-to-pay-modal-title': 'How to pay?',
      'how-to-pay-step-1': 'Select your preferred UPI app from the list.',
      'how-to-pay-step-2': 'Your chosen app will open with payment details pre-filled.',
      'how-to-pay-step-3': 'Enter your UPI PIN to authorize and complete the payment.',
      'how-to-pay-got-it': 'Got it',
      'details-how-to-pay-step-1': 'Copy the wallet number shown in the Beneficiary details section.',
      'details-how-to-pay-step-2': 'Open your wallet app and transfer the exact amount to the copied wallet number.',
      'details-how-to-pay-step-3': 'Enter your wallet number and upload a screenshot of the payment receipt.',
      'details-how-to-pay-step-4': 'Click on Submit button',
      'upi-ticker-line1a': 'Secured by Automatic Routing. ',
      'upi-ticker-line1b': 'Recipient name in UPI app may vary.',
      'paytm-app': 'Paytm',
      'upi-app': 'UPI',
      'phonepe-app': 'PhonePe',
      'gpay-app': 'Google Pay',
      'bhim-app': 'BHIM',
      'cred-app': 'CRED',
      'navi-app': 'Navi',
      'supermoney-app': 'Super.money',
      'amazonpay-app': 'Amazon Pay',
      'other-apps': 'Other Apps',
      'upi-app-not-found': 'This app was not found, please choose another app',
      'feedback': 'Feedback',
      'feedback-explore': 'I would like to explore more before completing transaction.',
      'feedback-dont-understand': 'I didn\'t understand what to do next.',
      'feedback-edit-details': 'I want to go back and edit my details.',
      'feedback-changed-mind': 'I changed my mind.',
      'skip': 'Skip',
      'submit-feedback': 'Submit Feedback',
      'feedback-error': 'Please select an option to submit your feedback',
      'mobile-wallet': 'Mobile Wallet',
      'continue': 'Proceed',
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
      'valid-wallet-number': 'Enter a valid wallet number (Length must be 11 digits, starting with 010 | 011 | 012 | 015).',
      'valid-wallet-number-mobile': 'Enter a valid wallet number (Length must be 10 digits, starting with 06 or 07).',
      'valid-transaction-ref-id': 'Enter a valid transaction reference ID',
      'submission-successful': 'Submission Successful',
      'submission-message': 'Your bank account details have been received successfully. We\'re processing your request and will complete it shortly.',
      'submission-message-bank': 'Your bank account details have been received successfully. We\'re processing your request and will complete it shortly.',
      'submission-message-wallet': 'Your wallet details have been received successfully. We\'re processing your request and will complete it shortly.',
      'return-to-home': 'Return to Home',
      'mobile-wallet-dropdown-label': 'Mobile Wallet',
      'wallet-number': 'Wallet Number',
      'wallet-name': 'Wallet Name',
      'select-wallet-app': 'Select your wallet app',
      'transfer-details': 'Your Account Details',
      'transfer-details-wallet': 'Your Wallet Details',
      'enter-wallet-name': 'Enter your wallet name',
      'valid-wallet-name': 'Enter a valid wallet name',
      'bank-transfer': 'Bank Deposit',
      'bank-transfer-method': 'Bank Transfer',
      'cash': 'Cash',
      'wallet': 'Wallet',
      'pay-at-fawry': 'Pay at Fawry',
      'wallet-phone-placeholder': '010XXXXXXXXX',
      'wallet-instruction-1': 'Enter your phone number.',
      'wallet-instruction-2': 'SMS is sent on your phone number.',
      'wallet-instruction-3': 'Complete the payment by clicking on link to approve the payment in your wallet app, OR dial the USSD code sent on SMS.',
      'pay-amount-egp': 'Pay EGP 500',
      'wallet-waiting-instruction': 'To complete your payment, open the SMS sent to your mobile number. Follow the link to pay using your wallet app or dial USSD code.',
      'wallet-waiting-line1': 'To complete your payment, open the SMS sent to your mobile number.',
      'wallet-waiting-line2': 'Follow the link to pay using your wallet app or dial USSD code.',
      'session-expiry-label': 'Session Expiry:',
      'pay-through-ussd': 'Pay through USSD code',
      'dial-ussd-code': 'Dial USSD code',
      'egypt-ussd-instruction': 'To complete the payment, click on the USSD code above, enter your wallet PIN, and follow the instructions to approve the transaction.',
      'pay-through-wallet-app': 'Pay through wallet app',
      'pay-in-app': 'Pay in App',
      'egypt-p2p-receipt-reminder': "Don't forget to take a screenshot of your payment receipt",
      'egypt-app-instruction': "To complete the payment, click on 'Pay in App,' open your wallet app, accept the payment request, and enter your wallet PIN to authorize the transaction.",
      'etisalat-app-not-found': 'App not found',
      'wecash-open-app-manually': 'Open the WE Pay app manually to approve the payment',
      'payment-details': 'Payment Details',
      'payment-amount': 'Payment Amount:',
      'reference-number': 'Reference Number:',
      'expiry-date': 'Expiry Date:',
      'fawry-instruction': 'Download the receipt to save the reference number:',
      'fawry-instruction-end': 'and show it at a Fawry store to make the payment before order expires.',
      'download-receipt': 'Download Receipt',
      'wallets-payment-method': 'Wallets',
      'ban-wallets-payment-method': 'Wallets',
      'pay-amount-bdt': 'Pay BDT 500',
      'pay-amount-php': 'Pay PHP 500',
      'dfnn-valid-mobile-number': 'Enter a valid mobile number (Must be 11 digits starting with 09)',
      'dfnn-wallet-mobile-placeholder': '09XXXXXXXXX',
      'philippines-qrph-accordion-title': 'QR PH',
      'download-qr': 'Download QR',
      'ph-qr-scan-instruction': 'Scan the QR using your QRPH-compatible banking or e-wallet app and complete the payment.',
      'ph-qr-we-support': 'We support QRPH-compatible apps',
      'philippines-qrph-instruction-1': 'Click <strong>Show QR</strong> to display the QR code. You can also <strong>Download the QR</strong> to save it.',
      'philippines-qrph-instruction-2': 'Open your preferred QRPH-compatible banking or e-wallet app.',
      'philippines-qrph-instruction-3': 'Use the app\'s QR payment feature to scan the displayed QR code or upload the downloaded QR image.',
      'philippines-qrph-instruction-4': 'Review the details and confirm the payment.',
      'mobile-number': 'Mobile number',
      'mobile-wallets': 'Mobile Wallet',
      'bank-dropdown-label': 'Bank',
      'select-bank': 'Select your bank',
      'bank-account-details-for-payment': 'Beneficiary details',
      'bank-account-number': 'Bank Account Number',
      'bank-account-name': 'Bank Account Name',
      'enter-account-number': 'Enter your account number',
      'enter-account-name': 'Enter your account name',
      'valid-account-number': 'Enter a valid account number',
      'valid-account-number-bank-transfer': 'Enter a valid account number (Length must be 24 digits)',
      'valid-account-name': 'Enter a valid account name',
      'payment-completion-title': '⚠️ Complete the transfer in your Bank Website/App using the beneficiary details displayed',
      'payment-completion-message': 'After making the payment in your Bank Website/App, please provide the below details:',
      'payment-completion-detail-1': 'Bank account details (bank account number and bank account name) from which the transfer was made',
      'payment-completion-detail-2': 'Proof of payment (receipt/screenshot)',
      'payment-completion-title-wallet': '⚠️ Complete the transfer in your wallet app using the displayed beneficiary details.',
      'payment-completion-message-wallet': 'After making the payment in your wallet app, please provide the below details:',
      'payment-completion-detail-1-wallet': 'Wallet details (wallet number and wallet name) from which the transfer was made',
      'payment-completion-detail-2-wallet': 'Proof of payment (receipt/screenshot)',
      'got-it': 'Got it'
    },
    hi: {
      'complete-payment': 'अपना भुगतान पूरा करें',
      'upi-qr-accordion-title': 'यूपीआई क्यूआर',
      'upi-accordion-title': 'यूपीआई',
      'upi-intent-accordion-title': 'UPI Intent',
      'upi-id': 'यूपीआई आईडी',
      'upi-id-placeholder': 'username@ybl, username@paytm...',
      'valid-upi-id': 'एक वैध UPI ID दर्ज करें (उदा: name@bankhandle)',
      'pay-amount-inr': 'INR 500 का भुगतान करें',
      'scan-qr-instruction': 'अपने UPI ऐप से QR स्कैन करें और 5 मिनट के भीतर भुगतान पूरा करें।',
      'net-banking-accordion-title': 'नेट बैंकिंग',
      'popular-banks': 'लोकप्रिय बैंक',
      'or-separator': 'या',
      'bank-label': 'बैंक',
      'select-your-bank': 'अपना बैंक चुनें',
      'sbi-bank': 'स्टेट बैंक ऑफ इंडिया',
      'kotak-bank': 'कोटक बैंक',
      'icici-bank': 'आईसीआईसीआई',
      'axis-bank': 'एक्सिस बैंक',
      'icici-bank-option': 'आईसीआईसीआई बैंक',
      'federal-bank': 'फेडरल बैंक',
      'hdfc-bank': 'एचडीएफसी बैंक',
      'sbi-bank-option': 'स्टेट बैंक ऑफ इंडिया',
      'pay-with-qr-code': 'QR कोड से भुगतान करें',
      'show-qr': 'QR दिखाएँ',
      'we-support-upi': 'हम सभी UPI handles को सपोर्ट करते हैं',
      'choose-payment-method': 'भुगतान पूरा करने के लिए नीचे कोई भी UPI ऐप चुनें।',
      'how-to-pay-link': 'कैसे भुगतान करें',
      'how-to-pay-modal-title': 'कैसे भुगतान करें?',
      'how-to-pay-step-1': 'सूची में से अपना पसंदीदा UPI ऐप चुनें।',
      'how-to-pay-step-2': 'आपका चुना हुआ ऐप भुगतान विवरण के साथ खुलेगा।',
      'how-to-pay-step-3': 'भुगतान अधिकृत करने और पूरा करने के लिए अपना UPI PIN दर्ज करें।',
      'upi-ticker-line1a': 'स्वचालित रूटिंग द्वारा सुरक्षित। ',
      'upi-ticker-line1b': 'UPI ऐप में प्राप्तकर्ता का नाम अलग हो सकता है।',
      'paytm-app': 'पेटीएम',
      'upi-app': 'यूपीआई',
      'phonepe-app': 'फोनपे',
      'gpay-app': 'गूगल पे',
      'bhim-app': 'भीम',
      'cred-app': 'क्रेड',
      'navi-app': 'नवि',
      'supermoney-app': 'सुपर.मनी',
      'amazonpay-app': 'अमेज़न पे',
      'other-apps': 'अन्य ऐप्स',
      'upi-app-not-found': 'यह ऐप नहीं मिला, कृपया कोई दूसरा ऐप चुनें',
      'order-id': 'ऑर्डर आईडी',
      'cancel': 'रद्द करें',
      'feedback': 'प्रतिक्रिया',
      'feedback-explore': 'लेनदेन पूरा करने से पहले मैं और विकल्प देखना चाहता/चाहती हूं।',
      'feedback-dont-understand': 'मुझे समझ नहीं आया कि आगे क्या करना है।',
      'feedback-edit-details': 'मैं वापस जाकर अपनी जानकारी संपादित करना चाहता/चाहती हूं।',
      'feedback-changed-mind': 'मैंने अपना मन बदल लिया है।',
      'skip': 'छोड़ें',
      'submit-feedback': 'प्रतिक्रिया सबमिट करें',
      'feedback-error': 'कृपया प्रतिक्रिया सबमिट करने के लिए एक विकल्प चुनें',
      'return-home': 'होम पर वापस जाएँ',
      'how-to-pay-got-it': 'समझ गया'
    },
    bn: {
      'expires-in': 'মেয়াদ শেষ হবে:',
      'complete-payment': 'আপনার পেমেন্ট সম্পন্ন করুন',
      'ban-wallets-payment-method': 'ওয়ালেটস',
      'payment-instructions': 'পেমেন্ট নির্দেশনা',
      'mobile-number': 'মোবাইল নম্বর',
      'wallet-mobile-placeholder': '০১XXXXXXXXX',
      'ban-wallet-valid-mobile-number': 'একটি সঠিক মোবাইল নম্বর লিখুন (১১ ডিজিট এবং 01 দিয়ে শুরু হতে হবে)',
      'valid-mobile-number': 'একটি সঠিক মোবাইল নম্বর লিখুন (১১ ডিজিট এবং 01 দিয়ে শুরু হতে হবে)',
      'pay-amount-bdt': 'BDT ৫০০ পরিশোধ করুন',
      'order-id': 'অর্ডার আইডি',
      'cancel': 'বাতিল',
      'return-home': 'হোমে ফিরে যান'
    },
    tl: {
      'expires-in': 'Mag-e-expire sa',
      'complete-payment': 'Kumpletuhin ang iyong bayad',
      'wallets-payment-method': 'Wallets',
      'wallet': 'Wallet',
      'select-wallet-app': 'Piliin ang wallet app mo',
      'payment-instructions': 'Mga Tagubilin sa Pagbabayad',
      'mobile-number': 'Numero ng mobile',
      'dfnn-wallet-mobile-placeholder': '09XXXXXXXXX',
      'dfnn-valid-mobile-number': 'Maglagay ng valid na mobile number (Dapat 11 digits na nagsisimula sa 09)',
      'pay-amount-php': 'Magbayad ng PHP 500',
      'philippines-qrph-accordion-title': 'QR PH',
      'download-qr': 'I-download ang QR',
      'show-qr': 'Ipakita ang QR',
      'ph-qr-scan-instruction': 'I-scan ang QR gamit ang iyong QRPH-compatible na banking o e-wallet app at kumpletuhin ang bayad.',
      'ph-qr-we-support': 'Sinusuportahan namin ang mga QRPH-compatible na app',
      'philippines-qrph-instruction-1': 'I-click ang <strong>Ipakita ang QR</strong> para ipakita ang QR code. Maaari mo ring <strong>i-download ang QR</strong> para i-save ito.',
      'philippines-qrph-instruction-2': 'Buksan ang iyong preferred na QRPH-compatible na banking o e-wallet app.',
      'philippines-qrph-instruction-3': 'Gamitin ang QR payment feature ng app para i-scan ang ipinapakitang QR code o i-upload ang na-download na QR image.',
      'philippines-qrph-instruction-4': 'Suriin ang mga detalye at kumpirmahin ang pagbabayad.',
      'show-payment-details': 'Magbayad sa pamamagitan ng Bank Transfer',
      'philippines-vca-send-payment-title': 'Magpadala ng bayad sa VCA number na ito gamit ang banking app o portal',
      'philippines-vca-bank-transfer-method': 'Paglipat sa Bangko',
      'amount': 'Halaga',
      'philippines-vca-label': 'Numero ng Virtual Collection Account (VCA):',
      'philippines-vca-instruction-1': 'I-click ang "Magbayad sa pamamagitan ng Bank Transfer" para makita ang account number at gamitin ito upang makumpleto ang transfer sa pamamagitan ng iyong banking app o portal.',
      'philippines-vca-instruction-2': 'Buksan ang iyong preferred na banking app o portal.',
      'philippines-vca-instruction-3': 'Piliin ang "Magpadala ng Pera" sa pamamagitan ng InstaPay at piliin ang "Iba pang Bangko o Wallet".',
      'philippines-vca-instruction-4': 'Ilagay ang mga detalye ng account (Numero ng Virtual Account) at eksaktong halaga na ipinapakita sa checkout.',
      'philippines-vca-instruction-5': 'Suriin ang mga detalye at kumpirmahin ang pagbabayad.',
      'philippines-vca-instruction-6': 'Kapag matagumpay ang pagbabayad, awtomatikong maa-update ang status ng iyong transaksyon.',
      'philippines-vca-important-label': 'Mahalaga:',
      'philippines-vca-important-text': 'Ang VCA number ay unique sa transaksyong ito at dapat gamitin lamang para sa pagbabayad na ito.',
      'copy': 'Kopyahin',
      'copied': 'Nakopya!',
      'order-id': 'ID ng Order',
      'cancel': 'Kanselahin',
      'feedback': 'Puna',
      'feedback-explore': 'Gusto kong mag-explore pa bago tapusin ang transaksyon.',
      'feedback-dont-understand': 'Hindi ko maintindihan ang susunod na gagawin.',
      'feedback-edit-details': 'Gusto kong bumalik at i-edit ang aking mga detalye.',
      'feedback-changed-mind': 'Nagbago ang isip ko.',
      'skip': 'Laktawan',
      'submit-feedback': 'Isumite ang Puna',
      'feedback-error': 'Mangyaring pumili ng opsyon para isumite ang iyong puna',
      'return-home': 'Bumalik sa Home'
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
      'otp-session-expires-in': 'OTP سیشن ختم ہونے میں:',
      'otp-instruction': 'اپنے ایزی پیسہ نمبر پر بھیجا گیا OTP درج کریں۔',
      'otp-incorrect-error': 'غلط OTP۔ براہ کرم دوبارہ کوشش کریں، آپ کے پاس 2 کوششیں باقی ہیں۔',
      'easypaisa-number-label': 'ایزی پیسہ نمبر',
      'otp-label': 'OTP',
      'otp-placeholder': 'تصدیق کے لیے OTP درج کریں',
      'otp-error': 'براہ کرم OTP درج کریں',
      'verify-otp': 'OTP کی تصدیق کریں',
      'submit-otp': 'OTP جمع کروائیں',
      'session-expire': 'آپ کا سیشن ختم ہو جائے گا',
      'account-number': 'اکاؤنٹ نمبر',
      'waiting-payment': 'ادائیگی کی منظوری کا انتظار',
      'notification-instruction': 'کیا آپ کو نوٹیفیکیشن موصول نہیں ہوا؟ اپنا Easypaisa ایپ کھولیں، "My Account" میں جائیں اور پھر "My Approvals" سے ادائیگی منظور کریں۔',
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
      'upi-qr-accordion-title': 'UPI QR',
      'upi-accordion-title': 'UPI',
      'upi-intent-accordion-title': 'UPI Intent',
      'pay-with-qr-code': 'QR کوڈ کے ذریعے ادائیگی کریں',
      'show-qr': 'QR دکھائیں',
      'we-support-upi': 'ہم تمام UPI handles کو سپورٹ کرتے ہیں',
      'choose-payment-method': 'ادائیگی مکمل کرنے کے لیے نیچے دی گئی کوئی بھی UPI ایپ منتخب کریں۔',
      'how-to-pay-link': 'ادائیگی کا طریقہ',
      'how-to-pay-got-it': 'سمجھ گیا',
      'upi-ticker-line1a': 'خودکار روٹنگ کے ذریعے محفوظ۔ ',
      'upi-ticker-line1b': 'UPI ایپ میں وصول کنندہ کا نام مختلف ہو سکتا ہے۔',
      'paytm-app': 'Paytm',
      'upi-app': 'UPI',
      'phonepe-app': 'PhonePe',
      'gpay-app': 'Google Pay',
      'bhim-app': 'BHIM',
      'cred-app': 'CRED',
      'navi-app': 'Navi',
      'supermoney-app': 'Super.money',
      'amazonpay-app': 'Amazon Pay',
      'other-apps': 'دیگر ایپس',
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
      'valid-wallet-number-mobile': 'درست والیٹ نمبر درج کریں (لمبائی 10 ہندسے ہونی چاہیے، اور 06 یا 07 سے شروع ہونا چاہیے)',
      'valid-transaction-ref-id': 'درست ٹرانزیکشن ریفرنس آئی ڈی درج کریں',
      'submission-successful': 'جمع کرانے کا عمل کامیاب ہو گیا',
      'submission-message': 'آپ کی بینک اکاؤنٹ کی تفصیلات کامیابی سے موصول ہو گئی ہیں۔ ہم آپ کی درخواست پر کارروائی کر رہے ہیں اور جلد ہی اسے مکمل کر دیا جائے گا۔',
      'submission-message-bank': 'آپ کی بینک اکاؤنٹ کی تفصیلات کامیابی سے موصول ہو گئی ہیں۔ ہم آپ کی درخواست پر کارروائی کر رہے ہیں اور جلد ہی اسے مکمل کر دیا جائے گا۔',
      'submission-message-wallet': 'آپ کے والیٹ کی تفصیلات کامیابی سے موصول ہو گئی ہیں۔ ہم آپ کی درخواست پر کارروائی کر رہے ہیں اور جلد ہی اسے مکمل کر دیا جائے گا۔',
      'return-to-home': 'واپس',
      'mobile-wallet-dropdown-label': 'موبائل والیٹ',
      'wallet-name': 'والیٹ نام',
      'select-wallet-app': 'اپنی والیٹ ایپ منتخب کریں',
      'transfer-details': 'ٹرانسفر کی تفصیلات',
      'transfer-details-wallet': 'آپ کے والیٹ کی تفصیلات',
      'enter-wallet-name': 'اپنا والیٹ نام درج کریں',
      'valid-wallet-name': 'درست والیٹ نام درج کریں',
      'bank-transfer': 'بینک ٹرانسفر',
      'bank-transfer-method': 'بینک ٹرانسفر',
      'cash': 'نقد',
      'wallet': 'محفظة',
      'pay-at-fawry': 'فوري کے ذریعے ادائیگی کریں',
      'wallet-phone-placeholder': '010XXXXXXXXX',
      'wallet-instruction-1': 'اپنا فون نمبر درج کریں۔',
      'wallet-instruction-2': 'آپ کے فون نمبر پر SMS بھیجا جاتا ہے۔',
      'wallet-instruction-3': 'اپنے والیٹ ایپ میں ادائیگی کی منظوری کے لیے لنک پر کلک کریں، یا SMS میں بھیجا گیا USSD کوڈ ڈائل کریں۔',
      'pay-amount-egp': 'ادفع 500 جنيه',
      'wallet-waiting-line1': 'اپنی ادائیگی مکمل کرنے کے لیے، اپنے موبائل نمبر پر بھیجے گئے SMS کو کھولیں۔',
      'wallet-waiting-line2': 'والیٹ ایپ سے ادائیگی کے لیے لنک پر عمل کریں یا USSD کوڈ ڈائل کریں۔',
      'payment-details': 'تفاصيل الدفع',
      'payment-amount': 'مبلغ الدفع:',
      'reference-number': 'الرقم المرجعي:',
      'expiry-date': 'تاريخ الانتهاء:',
      'fawry-instruction': 'قم بتنزيل الإيصال لحفظ الرقم المرجعي:',
      'fawry-instruction-end': 'وأبرزه في متجر فوري لإتمام الدفع قبل انتهاء الطلب.',
      'download-receipt': 'تحميل الإيصال',
      'wallets-payment-method': 'والیٹس',
      'mobile-wallets': 'موبائل والیٹ',
      'bank-dropdown-label': 'بینک',
      'select-bank': 'اپنا بینک منتخب کریں',
      'bank-account-details-for-payment': 'ادائیگی کے لیے بینک اکاؤنٹ کی تفصیلات',
      'bank-account-number': 'بینک اکاؤنٹ نمبر',
      'bank-account-name': 'بینک اکاؤنٹ نام',
      'enter-account-number': 'اپنا اکاؤنٹ نمبر درج کریں',
      'enter-account-name': 'اپنا اکاؤنٹ نام درج کریں',
      'valid-account-number': 'درست اکاؤنٹ نمبر درج کریں',
      'valid-account-number-bank-transfer': 'درست اکاؤنٹ نمبر درج کریں (لمبائی 24 ہندسے ہونی چاہیے)',
      'valid-account-name': 'درست اکاؤنٹ نام درج کریں',
      'payment-completion-title': '⚠️ اپنی بینک ویب سائٹ/ایپ میں ٹرانسفر مکمل کریں',
      'payment-completion-message': 'اپنی بینک ویب سائٹ/ایپ میں ادائیگی کرنے کے بعد، براہ کرم درج ذیل تفصیلات فراہم کریں:',
      'payment-completion-detail-1': 'بینک اکاؤنٹ کی تفصیلات (بینک اکاؤنٹ نمبر اور بینک اکاؤنٹ نام جہاں سے ٹرانسفر کیا گیا)',
      'payment-completion-detail-2': 'ادائیگی کا ثبوت (رسید/اسکرین شاٹ)',
      'payment-completion-title-wallet': '⚠️ دکھائی گئی مستفید کنندہ کی تفصیلات استعمال کرتے ہوئے اپنے والیٹ ایپ میں ٹرانسفر مکمل کریں۔',
      'payment-completion-message-wallet': 'اپنے والیٹ ایپ میں ادائیگی کرنے کے بعد، براہ کرم درج ذیل تفصیلات فراہم کریں:',
      'payment-completion-detail-1-wallet': 'والیٹ کی تفصیلات (والیٹ نمبر اور والیٹ نام جہاں سے ادائیگی کی گئی)',
      'payment-completion-detail-2-wallet': 'ادائیگی کا ثبوت (رسید/اسکرین شاٹ)',
      'got-it': 'سمجھ گیا'
    },
    ar: {
      'expires-in': 'الوقت على وشك الانتهاء',
      'complete-payment': 'أكمل عملية الدفع',
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
      'enter-wallet-number': 'أدخل رقم المحفظة',
      'transaction-reference-id': 'رقم مرجع المعاملة',
      'enter-transaction-ref-id': 'أدخل رقم مرجع المعاملة الخاص بك',
      'upload-receipt': 'تحميل الإيصال',
      'max-upload-size': 'أعلى حجم تحميل',
      'submit': 'إرسال',
      'valid-wallet-number': 'أدخل رقم محفظة صحيح (يجب أن يتكون من 11 رقمًا ويبدأ بـ 010 | 011 | 012 | 015).',
      'valid-wallet-number-mobile': 'أدخل رقم محفظة صالح (يجب أن يتكون من 10 أرقام ويبدأ بـ 06 أو 07)',
      'valid-transaction-ref-id': 'أدخل رقم مرجع معاملة صحيح',
      'submission-successful': 'تم الإرسال بنجاح',
      'submission-message': 'تم استلام تفاصيل الحساب البنكي بنجاح. نحن نعالج طلبك وسنكمله قريبًا.',
      'submission-message-bank': 'تم استلام تفاصيل الحساب البنكي بنجاح. نحن نعالج طلبك وسنكمله قريبًا.',
      'submission-message-wallet': 'تم استلام تفاصيل المحفظة بنجاح. نحن نعالج طلبك وسنكمله قريبًا.',
      'return-to-home': 'عودة الى الشاشة الرئيسية',
      'return-home': 'عودة الى الشاشة الرئيسية',
      'feedback': 'ملاحظات',
      'feedback-explore': 'أود استكشاف المزيد قبل إتمام المعاملة.',
      'feedback-dont-understand': 'لم أفهم ما يجب فعله بعد ذلك.',
      'feedback-edit-details': 'أريد العودة وتعديل تفاصيلي.',
      'feedback-changed-mind': 'غيرت رأيي.',
      'skip': 'تخطي',
      'submit-feedback': 'إرسال الملاحظات',
      'select-wallet-app': 'اختر تطبيق محفظتك',
      'mobile-wallet-dropdown-label': 'محفظة الهاتف المحمول',
      'payment-instructions': 'إرشادات الدفع',
      'continue': 'متابعة',
      'transfer-details': 'تفاصيل التحويل',
      'transfer-details-wallet': 'تفاصيل محفظتك',
      'enter-wallet-name': 'أدخل اسم المحفظة',
      'valid-wallet-name': 'أدخل اسم محفظة صالح',
      'supported-file-format': 'صيغ الملفات المدعومة: .jpg، .JPEG، و .png',
      'bank-transfer': 'تحويل بنكي',
      'bank-transfer-method': 'تحويل بنكي',
      'cash': 'نقد',
      'wallet': 'محفظة',
      'pay-at-fawry': 'ادفع عبر فوري',
      'upi-qr-accordion-title': 'UPI QR',
      'upi-accordion-title': 'UPI',
      'upi-intent-accordion-title': 'UPI Intent',
      'pay-with-qr-code': 'ادفع عبر رمز QR',
      'show-qr': 'عرض QR',
      'we-support-upi': 'ندعم جميع معرفات UPI',
      'choose-payment-method': 'اختر أي تطبيق UPI مدعوم أدناه لإكمال الدفع.',
      'how-to-pay-link': 'كيفية الدفع',
      'how-to-pay-modal-title': 'كيفية الدفع؟',
      'how-to-pay-got-it': 'فهمت',
      'details-how-to-pay-step-1': 'انسخ رقم المحفظة الظاهر في قسم تفاصيل المستفيد.',
      'details-how-to-pay-step-2': 'افتح تطبيق المحفظة وحوّل المبلغ المحدد إلى رقم المحفظة المنسوخ.',
      'details-how-to-pay-step-3': 'أدخل رقم محفظتك وحمّل لقطة شاشة لإيصال الدفع.',
      'details-how-to-pay-step-4': 'انقر على زر الإرسال',
      'upi-ticker-line1a': 'مؤمن عبر التوجيه التلقائي. ',
      'upi-ticker-line1b': 'قد يختلف اسم المستلم في تطبيق UPI.',
      'paytm-app': 'Paytm',
      'upi-app': 'UPI',
      'phonepe-app': 'PhonePe',
      'gpay-app': 'Google Pay',
      'bhim-app': 'BHIM',
      'cred-app': 'CRED',
      'navi-app': 'Navi',
      'supermoney-app': 'Super.money',
      'amazonpay-app': 'Amazon Pay',
      'other-apps': 'تطبيقات أخرى',
      'wallet-phone-placeholder': '010XXXXXXXXX',
      'wallet-instruction-1': 'أدخل رقم هاتفك.',
      'wallet-instruction-2': 'يتم إرسال رسالة SMS إلى رقم هاتفك.',
      'wallet-instruction-3': 'أكمل الدفع بالنقر على الرابط للموافقة على الدفع في تطبيق المحفظة، أو اطلب رمز USSD المرسل عبر SMS.',
      'pay-amount-egp': 'ادفع 500 جنيه',
      'wallet-waiting-instruction': 'باش تكمل الدفع، حل الرسالة اللي جات على رقم الهاتف ديالك. تبع الرابط باش تدفع من تطبيق المحفظة، أو طلب كود USSD.',
      'session-expire': 'جلستك غادي تسالي ف',
      'phone-number': 'رقم الهاتف',
      'wallet-waiting-line1': 'باش تكمل الدفع، حل الرسالة اللي جات على رقم الهاتف ديالك.',
      'wallet-waiting-line2': 'تبع الرابط باش تدفع من تطبيق المحفظة، أو طلب كود USSD.',
      'session-expiry-label': 'انتهاء الجلسة:',
      'pay-through-ussd': 'الدفع عبر رمز USSD',
      'dial-ussd-code': 'اطلب رمز USSD',
      'egypt-ussd-instruction': 'لإكمال الدفع، انقر على رمز USSD أعلاه، وأدخل رقم PIN الخاص بالمحفظة، واتبع التعليمات للموافقة على المعاملة.',
      'pay-through-wallet-app': 'الدفع عبر تطبيق المحفظة',
      'pay-in-app': 'الدفع في التطبيق',
      'egypt-p2p-receipt-reminder': 'لا تنسَ التقاط لقطة شاشة لإيصال الدفع الخاص بك',
      'egypt-app-instruction': 'لإكمال الدفع، انقر على "الدفع في التطبيق"، وافتح تطبيق المحفظة، واقبل طلب الدفع، وأدخل رقم PIN الخاص بالمحفظة للموافقة على المعاملة.',
      'etisalat-app-not-found': 'التطبيق غير موجود',
      'wecash-open-app-manually': 'افتح تطبيق WE Pay يدوياً لإتمام الدفع',
      'or-separator': 'أو',
      'payment-details': 'تفاصيل الدفع',
      'payment-amount': 'مبلغ الدفع:',
      'reference-number': 'الرقم المرجعي:',
      'expiry-date': 'تاريخ الانتهاء:',
      'fawry-instruction': 'قم بتنزيل الإيصال لحفظ الرقم المرجعي:',
      'fawry-instruction-end': 'وأظهره في متجر فوري لإتمام الدفع قبل انتهاء الطلب.',
      'download-receipt': 'تحميل الإيصال',
      'wallets-payment-method': 'المحافظ',
      'mobile-wallets': 'محفظة الجوال',
      'bank-dropdown-label': 'بنك',
      'select-bank': 'اختر البنك',
      'bank-account-details-for-payment': 'تفاصيل حساب البنك للدفع',
      'bank-account-number': 'رقم حساب البنك',
      'bank-account-name': 'اسم الحساب البنكي',
      'enter-account-number': 'أدخل رقم الحساب',
      'enter-account-name': 'أدخل اسم الحساب',
      'valid-account-number': 'أدخل رقم حساب صالح',
      'valid-account-number-bank-transfer': 'أدخل رقم حساب صالح (يجب أن يكون 24 رقمًا)',
      'valid-account-name': 'أدخل اسم حساب صالح',
      'payment-completion-title': '⚠️ أكمل التحويل في موقع/تطبيق البنك الخاص بك',
      'payment-completion-message': 'بعد إتمام الدفع في موقع/تطبيق البنك الخاص بك، يرجى تقديم المعلومات أدناه:',
      'payment-completion-detail-1': 'تفاصيل حساب البنك (رقم حساب البنك واسم حساب البنك الذي تم التحويل منه)',
      'payment-completion-detail-2': 'إثبات الدفع (إيصال أو لقطة شاشة)',
      'payment-completion-title-wallet': '⚠️ أكمل التحويل في تطبيق المحفظة باستخدام تفاصيل المستفيد المعروضة.',
      'payment-completion-message-wallet': 'بعد إتمام الدفع في تطبيق المحفظة، يرجى تقديم المعلومات أدناه:',
      'payment-completion-detail-1-wallet': 'تفاصيل المحفظة (رقم المحفظة واسم المحفظة التي تم التحويل منها)',
      'payment-completion-detail-2-wallet': 'إثبات الدفع (إيصال أو لقطة شاشة)',
      'got-it': 'فهمت'
    },
    fr: {
      'expires-in': 'Expire dans :',
      'complete-payment': 'Finalisez votre paiement',
      'order-id': 'Numéro de commande',
      'cancel': 'Annuler',
      'payment-instructions': 'Instructions de paiement',
      'bank-transfer': 'Bank Deposit',
      'bank-transfer-method': 'Virement bancaire',
      'cash': 'Cash',
      'wallet': 'Wallet',
      'upi-qr-accordion-title': 'UPI QR',
      'upi-accordion-title': 'UPI',
      'upi-intent-accordion-title': 'UPI Intent',
      'pay-with-qr-code': 'Payer avec le QR code',
      'show-qr': 'Afficher le QR',
      'we-support-upi': 'Nous prenons en charge tous les identifiants UPI',
      'choose-payment-method': 'Choisissez une application UPI ci-dessous pour terminer le paiement.',
      'how-to-pay-link': 'Comment payer',
      'how-to-pay-got-it': 'Compris',
      'upi-ticker-line1a': 'Sécurisé par routage automatique. ',
      'upi-ticker-line1b': 'Le nom du destinataire dans l’application UPI peut varier.',
      'paytm-app': 'Paytm',
      'upi-app': 'UPI',
      'phonepe-app': 'PhonePe',
      'gpay-app': 'Google Pay',
      'bhim-app': 'BHIM',
      'cred-app': 'CRED',
      'navi-app': 'Navi',
      'supermoney-app': 'Super.money',
      'amazonpay-app': 'Amazon Pay',
      'other-apps': 'Autres applications',
      'pay-at-fawry': 'Payer chez Fawry',
      'wallet-phone-placeholder': '010XXXXXXXXX',
      'wallet-instruction-1': 'Entrez votre numéro de téléphone.',
      'wallet-instruction-2': 'Un SMS est envoyé à votre numéro de téléphone.',
      'wallet-instruction-3': 'Terminez le paiement en cliquant sur le lien pour approuver le paiement dans votre application portefeuille, ou composez le code USSD envoyé par SMS.',
      'pay-amount-egp': 'Payer EGP 500',
      'session-expire': 'Votre session expirera dans',
      'phone-number': 'Numéro de téléphone',
      'wallet-waiting-line1': 'Pour finaliser votre paiement, ouvrez le SMS envoyé à votre numéro de mobile.',
      'wallet-waiting-line2': 'Suivez le lien pour payer via votre application portefeuille ou composez le code USSD.',
      'payment-details': 'Détails du paiement',
      'payment-amount': 'Montant du paiement :',
      'reference-number': 'Numéro de référence :',
      'expiry-date': 'Date d\'expiration :',
      'fawry-instruction': 'Téléchargez le reçu pour enregistrer le numéro de référence :',
      'fawry-instruction-end': 'et présentez-le dans un magasin Fawry pour effectuer le paiement avant l\'expiration de la commande.',
      'download-receipt': 'Télécharger le reçu',
      'wallets-payment-method': 'Wallets',
      'mobile-wallets': 'Portefeuille mobile',
      'mobile-wallet-dropdown-label': 'Numéro mobile',
      'select-wallet-app': 'Sélectionnez votre application de portefeuille',
      'continue': 'Continuer',
      'wallet-details-for-payment': 'Détails du portefeuille pour le paiement',
      'transfer-details': 'Les détails de votre compte',
      'transfer-details-wallet': 'Les détails de votre portefeuille',
      'wallet-number': 'Numéro de portefeuille',
      'wallet-name': 'Nom du portefeuille',
      'amount': 'Montant',
      'enter-wallet-number': 'Saisissez votre numéro de portefeuille',
      'enter-wallet-name': 'Saisissez le nom de votre portefeuille',
      'valid-wallet-number': 'Saisissez un numéro de portefeuille valide',
      'valid-wallet-number-mobile': 'Saisissez un numéro de portefeuille valide (10 chiffres, commençant par 06 ou 07).',
      'valid-wallet-name': 'Saisissez un nom de portefeuille valide',
      'bank-account-details-for-payment': 'Détails du bénéficiaire',
      'bank-dropdown-label': 'Banque',
      'select-bank': 'Sélectionnez votre banque',
      'bank-account-number': 'Numéro de compte bancaire',
      'bank-account-name': 'Nom du compte bancaire',
      'enter-account-number': 'Saisissez votre numéro de compte',
      'enter-account-name': 'Saisissez le nom de votre compte',
      'valid-account-number': 'Saisissez un numéro de compte valide',
      'valid-account-number-bank-transfer': 'Entrez un numéro de compte valide (la longueur doit être de 24 chiffres)',
      'valid-account-name': 'Saisissez un nom de compte valide',
      'upload-receipt': 'Télécharger le reçu',
      'max-upload-size': 'Taille maximale : 5 Mo',
      'supported-file-format': 'Formats pris en charge : .jpg, .JPEG et .png',
      'submit': 'Soumettre',
      'submission-successful': 'Soumission réussie',
      'submission-message': 'Les détails de votre compte bancaire ont été reçus avec succès. Nous traitons votre demande et la finaliserons sous peu.',
      'submission-message-bank': 'Les détails de votre compte bancaire ont été reçus avec succès. Nous traitons votre demande et la finaliserons sous peu.',
      'submission-message-wallet': 'Les détails de votre portefeuille ont été reçus avec succès. Nous traitons votre demande et la finaliserons sous peu.',
      'return-to-home': 'Retour à l\'accueil',
      'payment-completion-title': '⚠️ Complétez le transfert sur votre site/app bancaire en utilisant les informations du bénéficiaire affichées.',
      'payment-completion-message': 'Après avoir effectué le paiement sur votre site/app bancaire, veuillez fournir les détails ci-dessous :',
      'payment-completion-detail-1': 'Coordonnées bancaires (numéro de compte bancaire et nom du compte à partir duquel le transfert a été effectué)',
      'payment-completion-detail-2': 'Preuve de paiement (reçu / capture d\'écran)',
      'payment-completion-title-wallet': '⚠️ Terminez le transfert dans votre application de portefeuille en utilisant les détails du bénéficiaire affichés.',
      'payment-completion-message-wallet': 'Après avoir effectué le paiement dans votre application de portefeuille, veuillez fournir les détails ci-dessous :',
      'payment-completion-detail-1-wallet': 'Détails du portefeuille (numéro du portefeuille et nom du portefeuille à partir duquel le transfert a été effectué)',
      'payment-completion-detail-2-wallet': 'Preuve de paiement (reçu / capture d\'écran)',
      'got-it': 'Compris',
      'feedback': 'Commentaires',
      'feedback-explore': 'Je souhaite explorer davantage avant de finaliser la transaction.',
      'feedback-dont-understand': 'Je n\'ai pas compris la suite à donner.',
      'feedback-edit-details': 'Je souhaite revenir en arrière et modifier mes informations.',
      'feedback-changed-mind': 'J\'ai changé d\'avis.',
      'skip': 'Passer',
      'submit-feedback': 'Envoyer les commentaires',
      'copy': 'Copier',
      'copied': 'Copié !'
    },
    yo: {
      'expires-in': 'Yóò parí ní:',
      'complete-payment': 'Pari ìsanwó rẹ',
      'payment-instructions': 'Àwọn ìtónisonà ìsanwó',
      'order-id': 'Paṣẹ ID',
      'cancel': 'Fagilee',
      'bank-deposit': 'Bank Deposit',
      'amount': 'Iye owó:',
      'instruction-1': 'Tẹ "Fihan Awọn alaye Banki" lati ṣe agbekale nomba akọọlẹ banki alailẹgbẹ rẹ.',
      'instruction-2': 'Daakọ nọmba àkọọlẹ láti inú àlàyé ilé-ifowopamọ, kí o sì fi iye owó gangan tí a sọ sí i nínú ìṣẹjú 30.',
      'instruction-3': 'Lo ohun elo alagbeka ti banki rẹ tabi ile-ifowopamọ intaneeti lati ṣe gbigbe.',
      'show-bank-details': 'Ṣàfihàn àlàyé ilé-ifowópamọ́',
      'bank-details': 'Àlàyé Ilé-ifowopamọ',
      'account-name': 'Orúkọ Àkọọlẹ:',
      'account-number': 'Nómbà Àkọọlẹ:',
      'bank-name': 'Orúkọ Ilé-ifowopamọ:',
      'bank-code': 'Kóòdù Ilé-ifowopamọ:',
      'expiry-date': 'Ọjọ́ Ìparí:',
      'copy': 'Daakọ',
      'copied': 'Ti daakọ',
      'how-to-pay': 'Bí O Ṣe Lè Sanwó',
      'how-to-pay-instruction-1': 'Tẹ bọtìnù Daakọ kí o sì daakọ nómbà àkọọlẹ.',
      'how-to-pay-instruction-2': 'Fi iye owó gangan tí a fihan lókè sínú àkọọlẹ tí o daakọ nínú ìṣẹjú 30.',
      'how-to-pay-instruction-3': 'Lo ohun èlò alágbèéká ilé-ifowopamọ rẹ tàbí ìkànnì ìkànnì ayélujára láti ṣe ìfiránṣe owó.',
      'how-to-pay-instruction-4': 'Ìfiránṣe owó léyìn àkókò tó yàn tàbí pèlú iye owó míi kì yóò ṣàṣeyorí.',
      'how-to-pay-instruction-5': 'A ó jẹ́risi àṣẹ rẹ laifowoyi lẹ́yìn tí a bá gba owó náà.',
      'how-to-pay-instruction-6': 'Má ṣe pa ojú-ìwé yìí tàbí tún un ṣe.',
      'download-pdf': 'Gba PDF Kalẹ̀',
      'return-home': 'Padà Sí Ilé'
    },
    ig: {
      'expires-in': 'Ga-agwụ na:',
      'complete-payment': 'Mezue ịkwụ ụgwọ gị',
      'payment-instructions': 'Ntuziaka ịkwụ ụgwọ',
      'order-id': 'Nye iwu ID',
      'cancel': 'Kagbuo',
      'bank-deposit': 'Bank Deposit',
      'amount': 'Ego:',
      'instruction-1': 'Pịa "Gosi nkowa Bank" ka ịmeputa nomba akaụntụ akụ gị pụrụ iche.',
      'instruction-2': 'Detuo ọ̀nụọgụ akaụntụ site na nkowa ụlọ akụ ma tinye ego ziri ezi n\'ime nkeji iri atọ (30).',
      'instruction-3': 'Jiri ngwa mkpanaka ụlọ akụ gị ma ọ bụ ụlọ akụ intanetị mee mbufe.',
      'show-bank-details': 'Gosi nkowa ụlọ akụ',
      'bank-details': 'Nkọwa Ụlọ Akụ',
      'account-name': 'Aha Akauntụ:',
      'account-number': 'Ọnụọgụ Akauntụ:',
      'bank-name': 'Aha Ụlọ Akụ:',
      'bank-code': 'Koodu Ụlọ Akụ:',
      'expiry-date': 'Ụbọchị Mmechi:',
      'copy': 'Detuo',
      'copied': 'E depụtara',
      'how-to-pay': 'Otu! Ga-esi Kwụọ',
      'how-to-pay-instruction-1': 'Pịa bọtịnụ Detuo ma detuo ọnụọgụ akauntụ.',
      'how-to-pay-instruction-2': 'Tinye ego ziri ezi e gosiri n\'elu n\'ime nkeji iri atọ (30) n\'akauntụ i deturu.',
      'how-to-pay-instruction-3': 'Jiri ngwa ekwentị ụlọ akụ gị ma ọ bụ ịntanetị ụlọ akụ mee nnyefe ego.',
      'how-to-pay-instruction-4': 'Nnyefe ego emechara oge ma ọ bụ jiri ego dị iche agaghị aga nke ọma.',
      'how-to-pay-instruction-5': 'A ga-ekwenye ịtụ gị n\'akaụntụ akpaghị aka ozugbo enwetara ego.',
      'how-to-pay-instruction-6': 'Emechiela ma ọ bụ mee ka ibe a megharia.',
      'download-pdf': 'Budata PDF',
      'return-home': 'Laghachi n\'Ụlọ'
    },
    ha: {
      'expires-in': 'Za a ƙare a:',
      'complete-payment': 'Kammala biyan kuɗin ku',
      'payment-instructions': 'Umarnin Biyan Kudi',
      'order-id': 'Oda ID',
      'cancel': 'Soke',
      'bank-deposit': 'Bank Deposit',
      'amount': 'Adadin:',
      'instruction-1': 'Danna "Nuna bayanan Banki" don samar da lambar asusun banki na musamman.',
      'instruction-2': 'Kwafi lambar asusu daga bayanan banki kuma ka ajiye adadin kudin daidai cikin mintuna 30.',
      'instruction-3': 'Yi amfani da app ɗin hannu na bankin ku ko bankin intanet don yin canja wuri.',
      'show-bank-details': 'Nuna bayanan banki',
      'bank-details': 'Bayanin Banki',
      'account-name': 'Sunan Asusun:',
      'account-number': 'Lambar Asusun:',
      'bank-name': 'Sunan Banki:',
      'bank-code': 'Lambar Banki:',
      'expiry-date': 'Ranar Karewa:',
      'copy': 'Kwafi',
      'copied': 'An kwafa',
      'how-to-pay': 'Yadda Za a Biya',
      'how-to-pay-instruction-1': 'Danna maballin Kwafi sannan ka kwafi lambar asusun.',
      'how-to-pay-instruction-2': 'Ajiye adadin kudin da aka nuna a sama cikin mintuna 30 zuwa lambar asusun da aka kwafa.',
      'how-to-pay-instruction-3': 'Yi amfani da manhajar wayar bankinka ko bankin intanet don yin canja wurin kudi.',
      'how-to-pay-instruction-4': 'Canja wurin kudi bayan lokaci ko da wani adadi daban ba zai yi nasara ba.',
      'how-to-pay-instruction-5': 'Za a tabbatar da odarka kai tsaye da zarar an karbi kudin.',
      'how-to-pay-instruction-6': 'Kada ka rufe ko sabunta wannan shafin.',
      'download-pdf': 'Zazzage PDF',
      'return-home': 'Koma Gida'
    }
  };

  const NIGERIA_BANK_DEPOSIT_LANGS = ['en', 'yo', 'ig', 'ha'];
  const PHILIPPINES_VCA_BANK_TRANSFER_LANGS = ['en', 'tl'];

  function isNigeriaBankDepositExpanded() {
    const nigeriaCollapse = document.getElementById('collapseBankDepositNigeria');
    return !!(nigeriaCollapse && nigeriaCollapse.classList.contains('show'));
  }

  function isNigeriaBankDepositDetailsPage() {
    try {
      return sessionStorage.getItem('paymentMethod') === 'nigeria-bank-deposit';
    } catch (error) {
      return false;
    }
  }

  function isNigeriaBankDepositContext() {
    return isNigeriaBankDepositExpanded() || isNigeriaBankDepositDetailsPage();
  }

  function isDfnnIframeContext() {
    try {
      return window.location.pathname.includes('iframe.html') &&
        sessionStorage.getItem('paymentMethod') === 'dfnn-wallet';
    } catch (error) {
      return false;
    }
  }

  function isPhilippinesQrphExpanded() {
    const philippinesQrphCollapse = document.getElementById('collapsePhilippinesQrph');
    return !!(philippinesQrphCollapse && philippinesQrphCollapse.classList.contains('show'));
  }

  function isPhilippinesQrphPage() {
    try {
      return !!(document.body && document.body.classList.contains('ph-qr-page')) ||
        (sessionStorage.getItem('paymentMethod') === 'philippines-qrph' &&
          window.location.pathname.includes('ph-qr-page.html'));
    } catch (error) {
      return false;
    }
  }

  function isPhilippinesVcaBankTransferExpanded() {
    const philippinesVcaCollapse = document.getElementById('collapsePhilippinesVcaBankTransfer');
    return !!(philippinesVcaCollapse && philippinesVcaCollapse.classList.contains('show'));
  }

  function isPhilippinesVcaBankTransferDetailsPage() {
    try {
      return sessionStorage.getItem('paymentMethod') === 'philippines-vca-bank-transfer' &&
        (window.location.pathname.includes('details.html') ||
          document.getElementById('philippinesVcaBankTransferDetailsContent'));
    } catch (error) {
      return false;
    }
  }

  function isPhilippinesVcaBankTransferContext() {
    return isPhilippinesVcaBankTransferExpanded() || isPhilippinesVcaBankTransferDetailsPage();
  }

  function applyTranslationsToRoot(root, lang) {
    if (!root || !translations[lang]) {
      return;
    }
    root.querySelectorAll('[data-translate]').forEach((element) => {
      const key = element.getAttribute('data-translate');
      if (!translations[lang][key]) {
        return;
      }
      const isPhilippinesQrphInstructionKey = key && key.startsWith('philippines-qrph-instruction-');
      if (element.tagName === 'OPTION' || element.tagName === 'BUTTON') {
        element.textContent = translations[lang][key];
      } else if (isPhilippinesQrphInstructionKey) {
        element.innerHTML = translations[lang][key];
      } else {
        element.textContent = translations[lang][key];
      }
    });
    root.querySelectorAll('[data-translate-placeholder]').forEach((element) => {
      const key = element.getAttribute('data-translate-placeholder');
      if (translations[lang][key]) {
        element.placeholder = translations[lang][key];
      }
    });
  }

  function applyScopedTagalogSharedCheckoutUi() {
    if (!translations.tl) {
      return;
    }
    const sharedRoots = [
      document.querySelector('.heading-wrapper'),
      document.querySelector('.payment-box > .button-wrapper'),
      document.getElementById('exampleModal'),
      document.getElementById('feedbackModal')
    ].filter(Boolean);
    sharedRoots.forEach((root) => {
      applyTranslationsToRoot(root, 'tl');
    });
  }

  function applyNigeriaBankDepositScopedTranslations(lang) {
    if (!NIGERIA_BANK_DEPOSIT_LANGS.includes(lang) || !translations[lang]) {
      return;
    }
    const nigeriaCollapse = document.getElementById('collapseBankDepositNigeria');
    if (nigeriaCollapse) {
      const accordionItem = nigeriaCollapse.closest('.accordion-item');
      if (accordionItem) {
        applyTranslationsToRoot(accordionItem, lang);
      }
    }
    const headingWrapper = document.querySelector('.heading-wrapper');
    if (headingWrapper) {
      applyTranslationsToRoot(headingWrapper, lang);
    }
    const orderCancelRow = document.querySelector('.payment-box > .button-wrapper');
    if (orderCancelRow) {
      applyTranslationsToRoot(orderCancelRow, lang);
    }
  }

  function applyPhilippinesTagalogSharedCheckoutUi() {
    if (!translations.tl) {
      return;
    }
    const headingWrapper = document.querySelector('.heading-wrapper');
    if (headingWrapper) {
      applyTranslationsToRoot(headingWrapper, 'tl');
    }
    const orderCancelRow = document.querySelector('.payment-box > .button-wrapper');
    if (orderCancelRow) {
      applyTranslationsToRoot(orderCancelRow, 'tl');
    }
    const orderIdModal = document.getElementById('exampleModal');
    if (orderIdModal) {
      applyTranslationsToRoot(orderIdModal, 'tl');
    }
    const feedbackModal = document.getElementById('feedbackModal');
    if (feedbackModal) {
      applyTranslationsToRoot(feedbackModal, 'tl');
    }
  }

  function toggleNigeriaBankDepositLanguagePills() {
    const defaultPills = document.getElementById('headingLanguagePills');
    const nigeriaPills = document.getElementById('headingLanguagePillsNigeria');
    if (!defaultPills || !nigeriaPills) {
      return;
    }
    const isExpanded = isNigeriaBankDepositExpanded();
    defaultPills.classList.toggle('d-none', isExpanded);
    nigeriaPills.classList.toggle('d-none', !isExpanded);
    const currentLang = document.documentElement.getAttribute('lang') || sessionStorage.getItem('selectedLanguage') || 'en';
    if (isExpanded) {
      if (!NIGERIA_BANK_DEPOSIT_LANGS.includes(currentLang) && typeof switchLanguage === 'function') {
        switchLanguage('en');
      } else if (typeof switchLanguage === 'function') {
        switchLanguage(currentLang);
      }
    } else if (NIGERIA_BANK_DEPOSIT_LANGS.includes(currentLang) && currentLang !== 'en' && typeof switchLanguage === 'function') {
      switchLanguage('en');
    }
    bindLanguagePillTracking();
  }

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

  // Copy IBAN function
  function copyIban(event) {
    const ibanElement = document.getElementById('recipientIban');
    if (!ibanElement) {
      return;
    }
    const iban = ibanElement.textContent;
    navigator.clipboard.writeText(iban).then(function() {
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

  function copyPhilippinesVcaNumber(event) {
    const vcaNumberElement = document.getElementById('philippinesVcaNumber');
    if (!vcaNumberElement) {
      return;
    }
    const vcaNumber = vcaNumberElement.textContent;
    navigator.clipboard.writeText(vcaNumber).then(function() {
      const copyButton = event.target.closest('.copy-button-simple');
      if (!copyButton) {
        return;
      }
      const currentLang = sessionStorage.getItem('selectedLanguage') || document.documentElement.getAttribute('lang') || 'en';
      const spanElement = copyButton.querySelector('span');
      if (!spanElement) {
        return;
      }
      const copyLang = (currentLang === 'tl' && translations.tl) ? 'tl' : currentLang;
      const originalText = (translations[copyLang] && translations[copyLang]['copy'])
        ? translations[copyLang]['copy']
        : spanElement.textContent;
      let copiedText = 'Copied!';
      if (typeof translations !== 'undefined' && translations[copyLang] && translations[copyLang]['copied']) {
        copiedText = translations[copyLang]['copied'];
      }
      spanElement.textContent = copiedText;
      setTimeout(() => {
        if (typeof translations !== 'undefined' && translations[copyLang] && translations[copyLang]['copy']) {
          spanElement.textContent = translations[copyLang]['copy'];
        } else {
          spanElement.textContent = originalText;
        }
      }, 2000);
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
    if (['yo', 'ig', 'ha'].includes(lang) && !isNigeriaBankDepositContext()) {
      lang = 'en';
    }
    const dfnnAccordion = document.getElementById('collapseDfnnWallets');
    const isDfnnSelected = !!(dfnnAccordion && dfnnAccordion.classList.contains('show'));
    const philippinesQrphAccordion = document.getElementById('collapsePhilippinesQrph');
    const isPhilippinesQrphSelected = !!(philippinesQrphAccordion && philippinesQrphAccordion.classList.contains('show'));
    const isPhilippinesQrphQrPage = isPhilippinesQrphPage();
    const philippinesVcaAccordion = document.getElementById('collapsePhilippinesVcaBankTransfer');
    const isPhilippinesVcaSelected = !!(philippinesVcaAccordion && philippinesVcaAccordion.classList.contains('show'));
    const isPhilippinesVcaDetailsPage = isPhilippinesVcaBankTransferDetailsPage();
    const isDfnnIframeFlow = isDfnnIframeContext();
    if (lang === 'tl' && !isDfnnSelected && !isPhilippinesQrphSelected && !isPhilippinesQrphQrPage && !isPhilippinesVcaSelected && !isPhilippinesVcaDetailsPage && !isDfnnIframeFlow) {
      lang = 'en';
    }
    if (lang === 'bn' && isDfnnIframeFlow) {
      lang = 'en';
    }
    const languagePills = document.querySelectorAll('.language-pill');
    const paymentInstructionsTexts = document.querySelectorAll('.payment-instructions-text');
    const paymentInstructionsTextsUrdu = document.querySelectorAll('.payment-instructions-text-urdu');
    const paymentInstructionsTextsArabic = document.querySelectorAll('.payment-instructions-text-arabic');
    const paymentInstructionsTextsFrench = document.querySelectorAll('.payment-instructions-text-french');
    const paymentInstructionsTextsBangla = document.querySelectorAll('.payment-instructions-text-bangla');
    const paymentInstructionsTextsTagalog = document.querySelectorAll('.payment-instructions-text-tagalog');
    const arabicOnlyLabels = document.querySelectorAll('.arabic-only-label');
    const englishOnlyLabels = document.querySelectorAll('.english-only-label');
    const htmlElement = document.documentElement;
    // Easypaisa/JazzCash Simpesa -  note:
    // Keep Urdu scoped to Pakistan wallet flows only (Easypaisa/JazzCash);
    // other payment methods stay on global language.
    const easypaisaAccordion = document.getElementById('collapseEasypaisa');
    const jazzcashAccordion = document.getElementById('collapseJazzCash');
    const isEasypaisaSelected = !!(easypaisaAccordion && easypaisaAccordion.classList.contains('show'));
    const isJazzcashSelected = !!(jazzcashAccordion && jazzcashAccordion.classList.contains('show'));
    const isScopedPakistanWalletUrdu = lang === 'ur' && (isEasypaisaSelected || isJazzcashSelected);
    const isScopedPhilippinesTagalog = lang === 'tl' && !isDfnnIframeFlow && (isDfnnSelected || isPhilippinesQrphSelected || isPhilippinesQrphQrPage || isPhilippinesVcaSelected || isPhilippinesVcaDetailsPage);
    const isNigeriaBankDepositSelected = isNigeriaBankDepositContext();
    const isNigeriaBankDepositLang = NIGERIA_BANK_DEPOSIT_LANGS.includes(lang);
    let nigeriaOverlayLang = null;
    let translationLang = (isScopedPakistanWalletUrdu || isScopedPhilippinesTagalog) ? 'en' : lang;
    // BANK DEPOSIT - NIGERIA details page: translate full page with Nigeria languages.
    if (isNigeriaBankDepositDetailsPage() && isNigeriaBankDepositLang && !isScopedPakistanWalletUrdu) {
      translationLang = lang;
    } else if (isNigeriaBankDepositExpanded() && isNigeriaBankDepositLang && !isScopedPakistanWalletUrdu) {
      // Index checkout: keep global UI in English; overlay local languages on Nigeria accordion only.
      nigeriaOverlayLang = lang;
      if (lang !== 'en') {
        translationLang = 'en';
      }
    }
    // VCA BANK TRANSFER - PHILIPPINES details page: translate full page with English/Tagalog.
    if (isPhilippinesVcaBankTransferDetailsPage() && PHILIPPINES_VCA_BANK_TRANSFER_LANGS.includes(lang) && !isScopedPakistanWalletUrdu) {
      translationLang = lang;
    }
    // QR PH page: translate full page with English/Tagalog.
    if (isPhilippinesQrphQrPage && PHILIPPINES_VCA_BANK_TRANSFER_LANGS.includes(lang) && !isScopedPakistanWalletUrdu) {
      translationLang = lang;
    }
    const activeLanguageForPills = nigeriaOverlayLang || lang;
    const toBengaliDigits = (value) => String(value).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
    const fromAnyDigitsToNumber = (value) => {
      const normalized = String(value)
        .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
        .replace(/[^\d]/g, '');
      return normalized ? parseInt(normalized, 10) : 0;
    };
    paymentInstructionsTextsBangla.forEach((node) => {
      if (!node.dataset.originalBanglaText) {
        node.dataset.originalBanglaText = node.textContent || '';
      }
      if (translationLang === 'bn') {
        node.textContent = toBengaliDigits(node.dataset.originalBanglaText);
      } else {
        node.textContent = node.dataset.originalBanglaText;
      }
    });
    
    // Update direction based on selected language (Urdu should always be RTL).
    if (lang === 'ur' || translationLang === 'ar') {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', lang === 'ur' ? 'ur' : translationLang);
    } else if (nigeriaOverlayLang === 'yo' || nigeriaOverlayLang === 'ig' || nigeriaOverlayLang === 'ha' ||
      ['yo', 'ig', 'ha'].includes(translationLang)) {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', nigeriaOverlayLang || translationLang);
    } else if (translationLang === 'fr' || translationLang === 'hi' || translationLang === 'bn' || (lang === 'tl' && isScopedPhilippinesTagalog)) {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', lang === 'tl' && isScopedPhilippinesTagalog ? 'tl' : translationLang);
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', 'en');
    }
    
    // Update active state for language pills
    languagePills.forEach(pill => {
      const pillLang = pill.getAttribute('data-lang') || (
        pill.textContent && (pill.textContent.trim() === 'हिंदी' || pill.textContent.trim() === 'Hindi')
          ? 'hi'
          : (pill.textContent && pill.textContent.trim() === 'English' ? 'en' : null)
      );
      if (pillLang === activeLanguageForPills) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    
    // Translate all elements with data-translate attribute
    const translatableElements = document.querySelectorAll('[data-translate]');
    translatableElements.forEach(element => {
      const key = element.getAttribute('data-translate');
      if (ENGLISH_ONLY_TRANSLATION_KEYS.has(key)) {
        return;
      }
      if (translations[translationLang] && translations[translationLang][key]) {
        // Handle elements with nested spans (like error messages with dynamic content)
        if (element.id === 'pinRetryError' && element.querySelector('#attemptsRemaining')) {
          const attemptsSpan = element.querySelector('#attemptsRemaining');
          const attemptsValue = attemptsSpan.textContent;
          const translatedText = translations[translationLang][key];
          element.innerHTML = translatedText + ' <span id="attemptsRemaining">' + attemptsValue + '</span>';
        } else if (element.tagName === 'OPTION') {
          // For option elements, update text content
          element.textContent = translations[translationLang][key];
        } else if (element.tagName === 'BUTTON') {
          // For button elements, update text content
          element.textContent = translations[translationLang][key];
        } else if (element.classList.contains('selected-text')) {
          const mobileWalletTrigger = element.closest('#mobileWalletDropdownSelected');
          if (mobileWalletTrigger && mobileWalletTrigger.classList.contains('has-value')) {
            // Keep wallet icon + name built by the dropdown handler
          } else {
            element.textContent = translations[translationLang][key];
          }
        } else if (element.classList.contains('custom-dropdown-option')) {
          // For custom dropdown options
          element.textContent = translations[translationLang][key];
        } else if (key && key.startsWith('philippines-qrph-instruction-')) {
          element.innerHTML = translations[translationLang][key];
        } else {
          // For other elements (labels, spans, etc.), update text content
          element.textContent = translations[translationLang][key];
        }
      }
    });
    
    // Translate input placeholders with data-translate-placeholder attribute
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-translate-placeholder');
      if (translations[translationLang] && translations[translationLang][key]) {
        element.placeholder = translations[translationLang][key];
      }
    });
    
    // Show/hide language-specific text in payment instructions
    if (translationLang === 'en') {
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
      paymentInstructionsTextsBangla.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsTagalog.forEach(text => {
        text.style.display = 'none';
      });
    } else if (translationLang === 'ur') {
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
      paymentInstructionsTextsBangla.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsTagalog.forEach(text => {
        text.style.display = 'none';
      });
    } else if (translationLang === 'ar') {
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
      paymentInstructionsTextsBangla.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsTagalog.forEach(text => {
        text.style.display = 'none';
      });
    } else if (translationLang === 'fr') {
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
      paymentInstructionsTextsBangla.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsTagalog.forEach(text => {
        text.style.display = 'none';
      });
    } else if (translationLang === 'bn') {
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
        text.style.display = 'none';
      });
      paymentInstructionsTextsBangla.forEach(text => {
        text.style.display = 'block';
      });
      paymentInstructionsTextsTagalog.forEach(text => {
        text.style.display = 'none';
      });
    } else if (['yo', 'ig', 'ha'].includes(translationLang)) {
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
      paymentInstructionsTextsBangla.forEach(text => {
        text.style.display = 'none';
      });
      paymentInstructionsTextsTagalog.forEach(text => {
        text.style.display = 'none';
      });
    }

    // Show Arabic sub-labels only when Arabic is selected
    arabicOnlyLabels.forEach(label => {
      label.style.display = translationLang === 'ar' ? 'inline' : 'none';
    });
    englishOnlyLabels.forEach(label => {
      label.style.display = translationLang === 'ar' ? 'none' : 'inline';
    });

    if (isScopedPakistanWalletUrdu && translations.ur) {
      const targetAccordions = [];
      if (isEasypaisaSelected && easypaisaAccordion) {
        targetAccordions.push(easypaisaAccordion);
      }
      if (isJazzcashSelected && jazzcashAccordion) {
        targetAccordions.push(jazzcashAccordion);
      }
      targetAccordions.forEach((accordion) => {
        const accordionItem = accordion.closest('.accordion-item') || accordion;
        const translatableElements = accordionItem.querySelectorAll('[data-translate]');
        translatableElements.forEach((element) => {
          const key = element.getAttribute('data-translate');
          if (translations.ur[key]) {
            element.textContent = translations.ur[key];
          }
        });
        const placeholderElements = accordionItem.querySelectorAll('[data-translate-placeholder]');
        placeholderElements.forEach((element) => {
          const key = element.getAttribute('data-translate-placeholder');
          if (translations.ur[key]) {
            element.placeholder = translations.ur[key];
          }
        });
        const englishInstructions = accordion.querySelectorAll('.payment-instructions-text');
        const urduInstructions = accordion.querySelectorAll('.payment-instructions-text-urdu');
        englishInstructions.forEach((text) => {
          text.style.display = 'none';
        });
        urduInstructions.forEach((text) => {
          text.style.display = 'block';
        });
      });

      // Easypaisa Simpesa -  note:
      // Keep heading aligned with Urdu selection for Easypaisa flow.
      const completePaymentHeading = document.querySelector('[data-translate="complete-payment"]');
      if (completePaymentHeading && translations.ur['complete-payment']) {
        completePaymentHeading.textContent = translations.ur['complete-payment'];
      }
    }

    if (isScopedPhilippinesTagalog && translations.tl && dfnnAccordion && isDfnnSelected) {
      const accordionItem = dfnnAccordion.closest('.accordion-item') || dfnnAccordion;
      const translatableElements = accordionItem.querySelectorAll('[data-translate]');
      translatableElements.forEach((element) => {
        const key = element.getAttribute('data-translate');
        if (translations.tl[key]) {
          element.textContent = translations.tl[key];
        }
      });
      const placeholderElements = accordionItem.querySelectorAll('[data-translate-placeholder]');
      placeholderElements.forEach((element) => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations.tl[key]) {
          element.placeholder = translations.tl[key];
        }
      });
      const englishInstructions = dfnnAccordion.querySelectorAll('.payment-instructions-text');
      const tagalogInstructions = dfnnAccordion.querySelectorAll('.payment-instructions-text-tagalog');
      englishInstructions.forEach((text) => {
        text.style.display = 'none';
      });
      tagalogInstructions.forEach((text) => {
        text.style.display = 'block';
      });
    }

    if (isScopedPhilippinesTagalog && translations.tl && philippinesQrphAccordion && isPhilippinesQrphSelected) {
      const accordionItem = philippinesQrphAccordion.closest('.accordion-item') || philippinesQrphAccordion;
      applyTranslationsToRoot(accordionItem, 'tl');

      const completePaymentHeading = document.querySelector('[data-translate="complete-payment"]');
      if (completePaymentHeading && translations.tl['complete-payment']) {
        completePaymentHeading.textContent = translations.tl['complete-payment'];
      }
      const expiresInHeading = document.querySelector('[data-translate="expires-in"]');
      if (expiresInHeading && translations.tl['expires-in']) {
        expiresInHeading.textContent = translations.tl['expires-in'];
      }
    }

    if (isScopedPhilippinesTagalog && translations.tl && isPhilippinesQrphQrPage) {
      applyTranslationsToRoot(document.body, 'tl');
    }

    if (isScopedPhilippinesTagalog && translations.tl && philippinesVcaAccordion && isPhilippinesVcaSelected) {
      const accordionItem = philippinesVcaAccordion.closest('.accordion-item') || philippinesVcaAccordion;
      applyTranslationsToRoot(accordionItem, 'tl');
    }

    if (isScopedPhilippinesTagalog && translations.tl && isPhilippinesVcaDetailsPage) {
      const vcaDetailsContent = document.getElementById('philippinesVcaBankTransferDetailsContent');
      const headingWrapper = document.querySelector('.heading-wrapper');
      if (vcaDetailsContent) {
        applyTranslationsToRoot(vcaDetailsContent, 'tl');
      }
      if (headingWrapper) {
        applyTranslationsToRoot(headingWrapper, 'tl');
      }
    }

    if (isScopedPhilippinesTagalog && translations.tl) {
      applyPhilippinesTagalogSharedCheckoutUi();
    }

    const timerMinutesDisplay = document.getElementById('timerMinutesDisplay');
    const timerSecondsDisplay = document.getElementById('timerSecondsDisplay');
    if (timerMinutesDisplay && timerSecondsDisplay) {
      const minutesValue = fromAnyDigitsToNumber(timerMinutesDisplay.textContent);
      const secondsValue = fromAnyDigitsToNumber(timerSecondsDisplay.textContent);
      if (translationLang === 'bn') {
        timerMinutesDisplay.textContent = `${toBengaliDigits(minutesValue)}মি`;
        timerSecondsDisplay.textContent = `${toBengaliDigits(secondsValue)}সে`;
      } else {
        timerMinutesDisplay.textContent = `${minutesValue}m`;
        timerSecondsDisplay.textContent = `${secondsValue}s`;
      }
    } else {
      const staticTimerText = document.querySelector('.time-wrapper .time-text');
      if (staticTimerText) {
        const parts = (staticTimerText.textContent || '').match(/(\d+)\s*m\s*(\d+)\s*s/i);
        if (parts) {
          const minutesValue = parseInt(parts[1], 10);
          const secondsValue = parseInt(parts[2], 10);
          if (translationLang === 'bn') {
            staticTimerText.textContent = `${toBengaliDigits(minutesValue)}মি ${toBengaliDigits(secondsValue)}সে`;
          } else {
            staticTimerText.textContent = `${minutesValue}m ${secondsValue}s`;
          }
        }
      }
    }
    
    // Update custom dropdown placeholder if no value is selected
    const bankSelected = document.getElementById('bankDropdownSelected');
    if (bankSelected && !bankSelected.classList.contains('has-value')) {
      const selectedText = bankSelected.querySelector('.selected-text');
      if (selectedText && translations[translationLang] && translations[translationLang]['select-bank']) {
        selectedText.textContent = translations[translationLang]['select-bank'];
      }
    }

    const bankTransferSelected = document.getElementById('bankTransferDropdownSelected');
    if (bankTransferSelected && !bankTransferSelected.classList.contains('has-value')) {
      const selectedText = bankTransferSelected.querySelector('.selected-text');
      if (selectedText && translations[translationLang] && translations[translationLang]['select-bank']) {
        selectedText.textContent = translations[translationLang]['select-bank'];
      }
    }
    
    if (isNigeriaBankDepositExpanded() && isNigeriaBankDepositLang && nigeriaOverlayLang) {
      applyNigeriaBankDepositScopedTranslations(nigeriaOverlayLang);
    }

    // BANK DEPOSIT - NIGERIA details page: ensure visible sections pick up selected language.
    if (isNigeriaBankDepositDetailsPage() && isNigeriaBankDepositLang) {
      const nigeriaDetailsRoots = [
        document.querySelector('.heading-wrapper'),
        document.getElementById('nigeriaBankDepositDetailsContent')
      ].filter(Boolean);
      nigeriaDetailsRoots.forEach((root) => {
        applyTranslationsToRoot(root, lang);
      });
    }

    // VCA BANK TRANSFER - PHILIPPINES details page: ensure visible sections pick up selected language.
    if (isPhilippinesVcaBankTransferDetailsPage() && PHILIPPINES_VCA_BANK_TRANSFER_LANGS.includes(lang)) {
      const philippinesVcaDetailsRoots = [
        document.querySelector('.heading-wrapper'),
        document.getElementById('philippinesVcaBankTransferDetailsContent')
      ].filter(Boolean);
      philippinesVcaDetailsRoots.forEach((root) => {
        applyTranslationsToRoot(root, lang);
      });
    }

    // Save selected language to sessionStorage.
    // Easypaisa Simpesa -  note:
    // When Urdu is selected for Easypaisa-scoped translation, persist "ur"
    // so the next page (OTP/waiting) keeps Urdu selected.
    let persistedLanguage = translationLang;
    if (isScopedPakistanWalletUrdu) {
      persistedLanguage = 'ur';
    } else if (isDfnnIframeFlow && lang === 'tl') {
      persistedLanguage = 'tl';
    } else if ((isDfnnSelected || isPhilippinesQrphSelected || isPhilippinesQrphQrPage || isPhilippinesVcaSelected || isPhilippinesVcaDetailsPage) && lang === 'tl' && !isDfnnIframeFlow) {
      persistedLanguage = 'tl';
    } else if (isPhilippinesVcaBankTransferDetailsPage() && PHILIPPINES_VCA_BANK_TRANSFER_LANGS.includes(lang)) {
      persistedLanguage = lang;
    } else if (isPhilippinesQrphQrPage && PHILIPPINES_VCA_BANK_TRANSFER_LANGS.includes(lang)) {
      persistedLanguage = lang;
    } else if ((isNigeriaBankDepositSelected || isNigeriaBankDepositDetailsPage()) && isNigeriaBankDepositLang) {
      persistedLanguage = nigeriaOverlayLang || lang;
    }
    sessionStorage.setItem('selectedLanguage', persistedLanguage);

    // Keep selected bank display stable across language switches
    restoreSelectedBankFromStorage();

    const mobileWalletSelected = document.getElementById('mobileWalletDropdownSelected');
    if (mobileWalletSelected && !mobileWalletSelected.classList.contains('has-value')) {
      const selectedText = mobileWalletSelected.querySelector('.selected-text');
      if (selectedText && translations[translationLang] && translations[translationLang]['select-wallet-app']) {
        selectedText.textContent = translations[translationLang]['select-wallet-app'];
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    getTrackedOrderId();
    bindLanguagePillTracking();
    let pageExitTracked = false;
    const trackPageExitOnce = function() {
      if (pageExitTracked) {
        return;
      }
      pageExitTracked = true;
      // event: Page Exit (UPI (India) flow: provider: 'alt' isolates ALT page exits from the default merchant UPI flow)
      const pageExitProps = {
        page: getTrackedPageName(),
        order_id: getTrackedOrderId()
      };
      if (isAltUpiQrFlow()) {
        pageExitProps.provider = 'alt';
      }
      trackEvent('Page Exit', pageExitProps, { transport: 'sendBeacon' });
    };
    const isUpiQrPage = !!(document.body && document.body.classList.contains('upi-qr-page'));
    const isPhQrPage = !!(document.body && document.body.classList.contains('ph-qr-page'));
    if (isUpiQrPage) {
      // event: UPI QR Page Loaded (UPI (India) flow: only the ALT flow is tracked)
      if (isAltUpiQrFlow()) {
        trackEvent('UPI QR Page Loaded', { page: 'upi-qr', provider: 'alt', order_id: getTrackedOrderId() });
      }
    } else if (isPhQrPage) {
      // No analytics tracking on the PH QR page; kept to avoid falling through to the checkout-loaded branch below
    } else {
      if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) {
        // event: Mobile Checkout Loaded
        trackEvent('Mobile Checkout Loaded', { page: 'checkout', order_id: getTrackedOrderId() });
      } else {
        // event: Checkout Loaded
        trackEvent('Checkout Loaded', { page: 'checkout', order_id: getTrackedOrderId() });
      }
    }

    const howToPayLinks = document.querySelectorAll('.mobile-how-to-pay-link');
    howToPayLinks.forEach((link) => {
      link.addEventListener('click', function() {
        // event: How To Pay (UPI (India) flow: provider: 'alt' isolates ALT clicks from the default merchant UPI flow)
        const howToPayProps = {
          page: getTrackedPageName(),
          order_id: getTrackedOrderId()
        };
        if (isAltUpiInteraction(link)) {
          howToPayProps.provider = 'alt';
        }
        trackEvent('How To Pay', howToPayProps);
      });
    });

    const feedbackModalElement = document.getElementById('feedbackModal');
    if (feedbackModalElement) {
      const closeBtn = feedbackModalElement.querySelector('.btn-close');
      const skipBtn = feedbackModalElement.querySelector('[data-translate="skip"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          // event: Feedback Close Icon Click
          trackEvent('Feedback Close Icon Click', {
            page: getTrackedPageName(),
            order_id: getTrackedOrderId()
          });
        });
      }
      if (skipBtn) {
        skipBtn.addEventListener('click', function() {
          // event: Feedback Skip Click
          trackEvent('Feedback Skip Click', {
            page: getTrackedPageName(),
            order_id: getTrackedOrderId()
          });
        });
      }
    }

    window.addEventListener('popstate', function() {
      // event: Browser Back Or Forward (UPI (India) flow: provider: 'alt' isolates ALT navigation from the default merchant UPI flow)
      const backForwardProps = {
        page: getTrackedPageName(),
        order_id: getTrackedOrderId()
      };
      if (isAltUpiQrFlow()) {
        backForwardProps.provider = 'alt';
      }
      trackEvent('Browser Back Or Forward', backForwardProps);
    });

    window.addEventListener('pagehide', function() {
      trackPageExitOnce();
    });

    window.addEventListener('beforeunload', function() {
      trackPageExitOnce();
    });

    const trackPageVisible = function() {
      // event: Page Visible (UPI (India) flow: provider: 'alt' isolates ALT page-visible events from the default merchant UPI flow)
      const pageVisibleProps = {
        page: getTrackedPageName(),
        order_id: getTrackedOrderId()
      };
      if (isAltUpiQrFlow()) {
        pageVisibleProps.provider = 'alt';
      }
      trackEvent('Page Visible', pageVisibleProps);
    };

    window.addEventListener('pageshow', function() {
      pageExitTracked = false;
      trackPageVisible();
    });

    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        trackPageExitOnce();
      } else {
        pageExitTracked = false;
        trackPageVisible();
      }
    });

    window.addEventListener('blur', function() {
      trackPageExitOnce();
    });

    window.addEventListener('focus', function() {
      pageExitTracked = false;
      trackPageVisible();
    });

  });

  window.handleLanguagePillClick = function(lang) {
    trackSwitchLanguageEvent(lang);
    switchLanguage(lang);
  };

  function setupConditionalFrenchLanguageUI() {
    const mobileWalletCollapseEl = document.getElementById('collapseMobileWallets');
    const bankTransferCollapseEl = document.getElementById('collapseBankTransferMethod');
    const frenchPill = document.querySelector('.language-pill-french');
    const headingTitleRow = document.getElementById('headingTitleRow');
    if (!frenchPill || !headingTitleRow) {
      return;
    }
    if (frenchPill.dataset.conditionalUiBound === '1') {
      return;
    }
    frenchPill.dataset.conditionalUiBound = '1';

    function updateFrenchVisibility() {
      const shouldShowFrench =
        (mobileWalletCollapseEl && mobileWalletCollapseEl.classList.contains('show')) ||
        (bankTransferCollapseEl && bankTransferCollapseEl.classList.contains('show'));
      frenchPill.classList.toggle('d-none', !shouldShowFrench);
      headingTitleRow.classList.toggle('heading-title-row--multilang', shouldShowFrench);
      const docLang = document.documentElement.getAttribute('lang') || 'en';
      if (!shouldShowFrench && docLang === 'fr' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
    }

    if (mobileWalletCollapseEl) {
      mobileWalletCollapseEl.addEventListener('shown.bs.collapse', updateFrenchVisibility);
      mobileWalletCollapseEl.addEventListener('hidden.bs.collapse', updateFrenchVisibility);
    }
    if (bankTransferCollapseEl) {
      bankTransferCollapseEl.addEventListener('shown.bs.collapse', updateFrenchVisibility);
      bankTransferCollapseEl.addEventListener('hidden.bs.collapse', updateFrenchVisibility);
    }
    updateFrenchVisibility();
  }

  // Make switchLanguage available globally
  window.copyPhilippinesVcaNumber = copyPhilippinesVcaNumber;

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
  function goToWalletDetails(paymentMethod = 'bank') {
    if (paymentMethod === 'cash') {
      sessionStorage.setItem('paymentMethod', 'cash');
      window.location.href = 'details.html';
      return;
    }
    if (paymentMethod === 'mobile-wallet') {
      const mobileWalletSelect = document.getElementById('mobileWalletSelect');
      const selectedOption = mobileWalletSelect ? mobileWalletSelect.options[mobileWalletSelect.selectedIndex] : null;
      const selectedWalletValue = selectedOption && selectedOption.value ? selectedOption.value : '';
      const selectedWalletName = selectedOption && selectedOption.value ? selectedOption.textContent.trim() : '';
      if (!selectedWalletValue) {
        return;
      }
      sessionStorage.setItem('selectedWalletName', selectedWalletName);
      sessionStorage.setItem('selectedWalletValue', selectedWalletValue);
      sessionStorage.setItem('paymentMethod', 'mobile-wallet');
      window.location.href = 'details.html';
      return;
    }
    if (paymentMethod === 'bank-transfer') {
      const bankTransferSelect = document.getElementById('bankTransferSelect');
      const selectedOption = bankTransferSelect ? bankTransferSelect.options[bankTransferSelect.selectedIndex] : null;
      const selectedBankValue = selectedOption && selectedOption.value ? selectedOption.value : '';
      const selectedBankName = selectedOption && selectedOption.value ? selectedOption.textContent.trim() : '';
      if (!selectedBankValue) {
        return;
      }
      sessionStorage.setItem('selectedBankName', selectedBankName);
      sessionStorage.setItem('selectedBankValue', selectedBankValue);
      sessionStorage.setItem('paymentMethod', 'bank-transfer');
      sessionStorage.setItem('recipientBankAccountNumber', '123456789012345678901234');
      window.location.href = 'details.html';
      return;
    }

    const bankSelect = document.getElementById('bankSelect');
    const selectedOption = bankSelect ? bankSelect.options[bankSelect.selectedIndex] : null;
    const selectedBankName = selectedOption && selectedOption.value ? selectedOption.textContent.trim() : 'Bank AL Egypt';
    const selectedBankValue = selectedOption && selectedOption.value ? selectedOption.value : '';

    sessionStorage.setItem('selectedBankName', selectedBankName);
    if (selectedBankValue) {
      sessionStorage.setItem('selectedBankValue', selectedBankValue);
    }
    sessionStorage.setItem('paymentMethod', paymentMethod);
    sessionStorage.setItem('recipientBankAccountNumber', '12345678911234567');
    window.location.href = 'details.html';
  }

  window.goToWalletDetails = goToWalletDetails;

  function validateEgyptWalletPhoneNumber(phoneNumber) {
    return /^01[0-9]{8,10}$/.test(phoneNumber.trim());
  }

  function setEgyptWalletPhoneError(show) {
    const errorElement = document.getElementById('walletPhoneErrorEgypt');
    const phoneInput = document.getElementById('walletPhoneNumberEgypt');
    if (!errorElement || !phoneInput) {
      return;
    }
    errorElement.classList.toggle('show', show);
    phoneInput.classList.toggle('form-control-error', show);
  }

  function updateEgyptWalletPayButton() {
    const phoneInput = document.getElementById('walletPhoneNumberEgypt');
    const payButton = document.getElementById('walletPayButtonEgypt');
    if (!phoneInput || !payButton) {
      return;
    }
    const phoneValue = phoneInput.value.trim();
    payButton.disabled = !(phoneValue.length > 0 && validateEgyptWalletPhoneNumber(phoneValue));
  }

  function validateBanWalletMobileNumber(phoneNumber) {
    return /^01[0-9]{9}$/.test(phoneNumber.trim());
  }

  function setEasypaisaMobileError(show) {
    const errorElement = document.getElementById('easypaisaNumberError');
    const mobileInput = document.getElementById('easypaisaInput');
    if (!errorElement || !mobileInput) {
      return;
    }
    errorElement.classList.toggle('d-none', !show);
    mobileInput.classList.toggle('form-control-error', show);
  }

  function updateEasypaisaPayButton() {
    const mobileInput = document.getElementById('easypaisaInput');
    const payButton = document.getElementById('mpesaPayButton');
    if (!mobileInput || !payButton) {
      return;
    }
    payButton.disabled = !validatePhoneNumber(mobileInput.value);
  }

  function setJazzcashMobileError(show) {
    const errorElement = document.getElementById('jazzcashNumberError');
    const mobileInput = document.getElementById('jazzcashInput');
    if (!errorElement || !mobileInput) {
      return;
    }
    errorElement.classList.toggle('d-none', !show);
    mobileInput.classList.toggle('form-control-error', show);
  }

  function updateJazzcashPayButton() {
    const mobileInput = document.getElementById('jazzcashInput');
    const payButton = document.getElementById('jazzcashPayButton');
    if (!mobileInput || !payButton) {
      return;
    }
    payButton.disabled = !validatePhoneNumber(mobileInput.value);
  }

  function setBanWalletMobileError(show) {
    const errorElement = document.getElementById('banWalletMobileError');
    const mobileInput = document.getElementById('banWalletMobileInput');
    if (!errorElement || !mobileInput) {
      return;
    }
    errorElement.classList.toggle('d-none', !show);
    mobileInput.classList.toggle('form-control-error', show);
  }

  function updateBanWalletPayButton() {
    const mobileInput = document.getElementById('banWalletMobileInput');
    const payButton = document.getElementById('banWalletPayButton');
    if (!mobileInput || !payButton) {
      return;
    }
    const hasWalletSelected = !!document.querySelector('input[name="banWalletOption"]:checked');
    const isMobileValid = validateBanWalletMobileNumber(mobileInput.value);
    payButton.disabled = !(hasWalletSelected && isMobileValid);
  }

  // Philippines DFNN mobile validation — disabled for now; re-enable when required
  // function validateDfnnMobileNumber(phoneNumber) {
  //   const trimmed = String(phoneNumber || '').trim();
  //   // Philippines DFNN wallets: local format only — 11 digits starting with 09
  //   if (!/^09\d{9}$/.test(trimmed)) {
  //     return false;
  //   }
  //   if (typeof libphonenumber !== 'undefined' && typeof libphonenumber.parsePhoneNumberFromString === 'function') {
  //     const parsed = libphonenumber.parsePhoneNumberFromString(trimmed, 'PH');
  //     return !!(parsed && parsed.isValid());
  //   }
  //   return true;
  // }

  // function setDfnnMobileError(show) {
  //   const errorElement = document.getElementById('dfnnWalletMobileError');
  //   const mobileInput = document.getElementById('dfnnWalletMobileInput');
  //   if (!errorElement || !mobileInput) {
  //     return;
  //   }
  //   errorElement.classList.toggle('d-none', !show);
  //   mobileInput.classList.toggle('form-control-error', show);
  // }

  function updateDfnnInstructionWalletName(walletName) {
    const walletNameElement = document.getElementById('dfnnSelectedWalletAppName');
    const walletNameElementTl = document.getElementById('dfnnSelectedWalletAppNameTl');
    const displayName = walletName || 'GCash/Maya';
    if (walletNameElement) {
      walletNameElement.textContent = displayName;
    }
    if (walletNameElementTl) {
      walletNameElementTl.textContent = displayName;
    }
  }

  function updateDfnnWalletPayButton() {
    const mobileInput = document.getElementById('dfnnWalletMobileInput');
    const payButton = document.getElementById('dfnnWalletPayButton');
    const walletSelect = document.getElementById('dfnnWalletSelect');
    if (!mobileInput || !payButton || !walletSelect) {
      return;
    }
    const hasWalletSelected = !!walletSelect.value;
    const hasMobileValue = mobileInput.value.trim().length > 0;
    // const isMobileValid = validateDfnnMobileNumber(mobileInput.value);
    // payButton.disabled = !(hasWalletSelected && isMobileValid);
    payButton.disabled = !(hasWalletSelected && hasMobileValue);
  }

  window.handleEgyptWalletPayClick = function() {
    const phoneInput = document.getElementById('walletPhoneNumberEgypt');
    if (!phoneInput) {
      return false;
    }
    const phoneValue = phoneInput.value.trim();
    if (!phoneValue || !validateEgyptWalletPhoneNumber(phoneValue)) {
      setEgyptWalletPhoneError(true);
      return false;
    }
    // Easypaisa Simpesa -  note:
    // Explicitly set non-Easypaisa context so waiting page does not inherit stale Easypaisa state.
    const egyptProvider = getEgyptTelecomProviderFromPhone(phoneValue);
    sessionStorage.setItem('checkoutWallet', 'wallet-egypt');
    sessionStorage.removeItem('easypaisaNumber');
    sessionStorage.removeItem('egyptWalletAppHandoff');
    sessionStorage.setItem('walletPhoneNumber', phoneValue);
    sessionStorage.setItem('egyptTelecomProvider', egyptProvider.id);
    sessionStorage.setItem('egyptUssdCode', egyptProvider.ussdCode);
    sessionStorage.setItem('paymentAmount', 'EGP 500');
    window.location.href = 'waiting.html';
    return true;
  };

  // Custom Bank Dropdown Functionality
  document.addEventListener('DOMContentLoaded', function() {
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/html-upi/') || window.location.pathname.endsWith('/html-upi');
    if (isIndexPage) {
      // Reset dropdown selection on full page reload/navigation to index
      sessionStorage.removeItem('selectedBankValue');
      sessionStorage.removeItem('selectedBankName');
      sessionStorage.removeItem('selectedWalletValue');
      sessionStorage.removeItem('selectedWalletName');
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

    const mobileWalletSelected = document.getElementById('mobileWalletDropdownSelected');
    const mobileWalletOptions = document.getElementById('mobileWalletDropdownOptions');
    const mobileWalletSelect = document.getElementById('mobileWalletSelect');
    const mobileWalletOptionElements = document.querySelectorAll('#mobileWalletDropdownOptions .custom-dropdown-option');
    const mobileWalletsContinueButton = document.getElementById('mobileWalletsContinueButton');
    const bankTransferSelected = document.getElementById('bankTransferDropdownSelected');
    const bankTransferOptions = document.getElementById('bankTransferDropdownOptions');
    const bankTransferSelect = document.getElementById('bankTransferSelect');
    const bankTransferOptionElements = document.querySelectorAll('#bankTransferDropdownOptions .custom-dropdown-option');
    const bankTransferContinueButton = document.getElementById('bankTransferContinueButton');

    if (mobileWalletSelected && mobileWalletOptions) {
      mobileWalletSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        mobileWalletOptions.classList.toggle('show');
        mobileWalletSelected.classList.toggle('active');
      });

      document.addEventListener('click', function(e) {
        if (!mobileWalletSelected.contains(e.target) && !mobileWalletOptions.contains(e.target)) {
          mobileWalletOptions.classList.remove('show');
          mobileWalletSelected.classList.remove('active');
        }
      });

      mobileWalletOptionElements.forEach(option => {
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          const value = this.getAttribute('data-value');
          const textSpan = this.querySelector('span');
          const text = textSpan ? textSpan.textContent.trim() : this.textContent.trim();
          const iconImg = this.querySelector('.wallet-option-icon');
          const selectedText = mobileWalletSelected.querySelector('.selected-text');
          const walletNameDisplay = document.getElementById('walletNameDisplay');
          const walletDetailsSection = document.getElementById('walletDetailsSection');

          if (value === '') {
            const currentLang = document.documentElement.getAttribute('lang') || 'en';
            const placeholderText = translations && translations[currentLang] && translations[currentLang]['select-wallet-app']
              ? translations[currentLang]['select-wallet-app']
              : 'Select your wallet app';
            selectedText.innerHTML = '';
            selectedText.textContent = placeholderText;
            mobileWalletSelected.classList.remove('has-value');
            if (mobileWalletSelect) {
              mobileWalletSelect.value = '';
            }
            if (walletNameDisplay) {
              walletNameDisplay.textContent = 'CashPlus';
            }
            sessionStorage.removeItem('selectedWalletName');
            sessionStorage.removeItem('selectedWalletValue');
            if (walletDetailsSection) {
              walletDetailsSection.classList.add('d-none');
            }
            if (mobileWalletsContinueButton) {
              mobileWalletsContinueButton.disabled = true;
            }
          } else {
            selectedText.innerHTML = '';
            if (iconImg) {
              const clonedIcon = iconImg.cloneNode(true);
              clonedIcon.classList.add('wallet-selected-icon');
              selectedText.appendChild(clonedIcon);
            }
            const nameSpan = document.createElement('span');
            nameSpan.textContent = text;
            selectedText.appendChild(nameSpan);
            mobileWalletSelected.classList.add('has-value');
            if (mobileWalletSelect) {
              mobileWalletSelect.value = value;
            }
            if (walletNameDisplay) {
              walletNameDisplay.textContent = text;
            }
            sessionStorage.setItem('selectedWalletName', text);
            sessionStorage.setItem('selectedWalletValue', value);
            if (walletDetailsSection) {
              walletDetailsSection.classList.remove('d-none');
            }
            if (mobileWalletsContinueButton) {
              mobileWalletsContinueButton.disabled = false;
            }
          }

          mobileWalletOptions.classList.remove('show');
          mobileWalletSelected.classList.remove('active');
        });
      });
    }

    if (bankTransferSelected && bankTransferOptions) {
      bankTransferSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        bankTransferOptions.classList.toggle('show');
        bankTransferSelected.classList.toggle('active');
      });

      document.addEventListener('click', function(e) {
        if (!bankTransferSelected.contains(e.target) && !bankTransferOptions.contains(e.target)) {
          bankTransferOptions.classList.remove('show');
          bankTransferSelected.classList.remove('active');
        }
      });

      bankTransferOptionElements.forEach(option => {
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          const value = this.getAttribute('data-value');
          const text = this.textContent.trim();
          const selectedText = bankTransferSelected.querySelector('.selected-text');

          if (value === '') {
            const currentLang = document.documentElement.getAttribute('lang') || 'en';
            const placeholderText = translations && translations[currentLang] && translations[currentLang]['select-bank']
              ? translations[currentLang]['select-bank']
              : 'Select your bank';
            selectedText.textContent = placeholderText;
            bankTransferSelected.classList.remove('has-value');
            if (bankTransferSelect) {
              bankTransferSelect.value = '';
            }
            if (bankTransferContinueButton) {
              bankTransferContinueButton.disabled = true;
            }
          } else {
            selectedText.textContent = text;
            bankTransferSelected.classList.add('has-value');
            if (bankTransferSelect) {
              bankTransferSelect.value = value;
            }
            if (bankTransferContinueButton) {
              bankTransferContinueButton.disabled = false;
            }
            sessionStorage.setItem('selectedBankValue', value);
            sessionStorage.setItem('selectedBankName', text);
          }

          bankTransferOptions.classList.remove('show');
          bankTransferSelected.classList.remove('active');
        });
      });
    }

    const dfnnWalletSelected = document.getElementById('dfnnWalletDropdownSelected');
    const dfnnWalletOptions = document.getElementById('dfnnWalletDropdownOptions');
    const dfnnWalletSelect = document.getElementById('dfnnWalletSelect');
    const dfnnWalletOptionElements = document.querySelectorAll('#dfnnWalletDropdownOptions .custom-dropdown-option');

    if (dfnnWalletSelected && dfnnWalletOptions) {
      dfnnWalletSelected.addEventListener('click', function(e) {
        e.stopPropagation();
        dfnnWalletOptions.classList.toggle('show');
        dfnnWalletSelected.classList.toggle('active');
      });

      document.addEventListener('click', function(e) {
        if (!dfnnWalletSelected.contains(e.target) && !dfnnWalletOptions.contains(e.target)) {
          dfnnWalletOptions.classList.remove('show');
          dfnnWalletSelected.classList.remove('active');
        }
      });

      dfnnWalletOptionElements.forEach(option => {
        option.addEventListener('click', function(e) {
          e.stopPropagation();
          const value = this.getAttribute('data-value');
          const textSpan = this.querySelector('span');
          const text = textSpan ? textSpan.textContent.trim() : this.textContent.trim();
          const iconImg = this.querySelector('.wallet-option-icon');
          const selectedText = dfnnWalletSelected.querySelector('.selected-text');

          if (value === '') {
            const currentLang = document.documentElement.getAttribute('lang') || 'en';
            const placeholderText = translations && translations[currentLang] && translations[currentLang]['select-wallet-app']
              ? translations[currentLang]['select-wallet-app']
              : 'Select your wallet app';
            selectedText.innerHTML = '';
            selectedText.textContent = placeholderText;
            dfnnWalletSelected.classList.remove('has-value');
            if (dfnnWalletSelect) {
              dfnnWalletSelect.value = '';
            }
            updateDfnnInstructionWalletName('');
          } else {
            selectedText.innerHTML = '';
            if (iconImg) {
              const clonedIcon = iconImg.cloneNode(true);
              clonedIcon.classList.add('wallet-selected-icon');
              selectedText.appendChild(clonedIcon);
            }
            const nameSpan = document.createElement('span');
            nameSpan.textContent = text;
            selectedText.appendChild(nameSpan);
            dfnnWalletSelected.classList.add('has-value');
            if (dfnnWalletSelect) {
              dfnnWalletSelect.value = value;
            }
            updateDfnnInstructionWalletName(text);
          }

          updateDfnnWalletPayButton();
          dfnnWalletOptions.classList.remove('show');
          dfnnWalletSelected.classList.remove('active');
        });
      });
    }

    setupConditionalFrenchLanguageUI();

    const walletPhoneInputEgypt = document.getElementById('walletPhoneNumberEgypt');
    if (walletPhoneInputEgypt) {
      setEgyptWalletPhoneError(false);
      updateEgyptWalletPayButton();
      walletPhoneInputEgypt.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 12);
        if (validateEgyptWalletPhoneNumber(this.value)) {
          setEgyptWalletPhoneError(false);
        } else if (this.value.trim().length === 0) {
          setEgyptWalletPhoneError(false);
        }
        updateEgyptWalletPayButton();
      });
      walletPhoneInputEgypt.addEventListener('blur', function() {
        const value = this.value.trim();
        setEgyptWalletPhoneError(value.length > 0 && !validateEgyptWalletPhoneNumber(value));
      });
    }

    const banWalletMobileInput = document.getElementById('banWalletMobileInput');
    const banWalletOptionInputs = document.querySelectorAll('input[name="banWalletOption"]');
    const easypaisaInput = document.getElementById('easypaisaInput');
    const jazzcashInput = document.getElementById('jazzcashInput');
    if (easypaisaInput) {
      setEasypaisaMobileError(false);
      updateEasypaisaPayButton();
      easypaisaInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 11);
        const value = this.value.trim();
        if (!value || validatePhoneNumber(value)) {
          setEasypaisaMobileError(false);
        }
        updateEasypaisaPayButton();
      });
      easypaisaInput.addEventListener('blur', function() {
        const value = this.value.trim();
        setEasypaisaMobileError(value.length > 0 && !validatePhoneNumber(value));
      });
    }

    if (jazzcashInput) {
      setJazzcashMobileError(false);
      updateJazzcashPayButton();
      jazzcashInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 11);
        const value = this.value.trim();
        if (!value || validatePhoneNumber(value)) {
          setJazzcashMobileError(false);
        }
        updateJazzcashPayButton();
      });
      jazzcashInput.addEventListener('blur', function() {
        const value = this.value.trim();
        setJazzcashMobileError(value.length > 0 && !validatePhoneNumber(value));
      });
    }

    if (banWalletMobileInput) {
      setBanWalletMobileError(false);
      updateBanWalletPayButton();
      banWalletMobileInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 11);
        const value = this.value.trim();
        if (!value || validateBanWalletMobileNumber(value)) {
          setBanWalletMobileError(false);
        }
        updateBanWalletPayButton();
      });
      banWalletMobileInput.addEventListener('blur', function() {
        const value = this.value.trim();
        setBanWalletMobileError(value.length > 0 && !validateBanWalletMobileNumber(value));
      });
    }
    banWalletOptionInputs.forEach((optionInput) => {
      optionInput.addEventListener('change', function() {
        updateBanWalletPayButton();
      });
    });

    const banWalletPayButton = document.getElementById('banWalletPayButton');
    if (banWalletPayButton) {
      banWalletPayButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (banWalletPayButton.disabled) {
          return;
        }
        const currentLang = document.documentElement.getAttribute('lang') || sessionStorage.getItem('selectedLanguage') || 'en';
        sessionStorage.setItem('paymentMethod', 'ban-wallet');
        sessionStorage.setItem('selectedLanguage', currentLang === 'bn' ? 'bn' : 'en');
        window.location.href = 'iframe.html';
      });
    }

    const dfnnWalletMobileInput = document.getElementById('dfnnWalletMobileInput');
    if (dfnnWalletMobileInput) {
      dfnnWalletMobileInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        // setDfnnMobileError(false);
        updateDfnnWalletPayButton();
      });
      // dfnnWalletMobileInput.addEventListener('blur', function() {
      //   const value = this.value.trim();
      //   if (value.length > 0 && !validateDfnnMobileNumber(value)) {
      //     setDfnnMobileError(true);
      //   }
      // });
    }

    const dfnnWalletPayButton = document.getElementById('dfnnWalletPayButton');
    if (dfnnWalletPayButton) {
      dfnnWalletPayButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (dfnnWalletPayButton.disabled) {
          return;
        }
        const mobileInput = document.getElementById('dfnnWalletMobileInput');
        const walletSelect = document.getElementById('dfnnWalletSelect');
        const mobileValue = mobileInput ? mobileInput.value.trim() : '';
        const selectedWalletValue = walletSelect ? walletSelect.value : '';
        const selectedWalletName = walletSelect && walletSelect.selectedIndex >= 0
          ? walletSelect.options[walletSelect.selectedIndex].textContent.trim()
          : '';
        if (!selectedWalletValue || !mobileValue) {
          // if (!selectedWalletValue || !mobileValue || !validateDfnnMobileNumber(mobileValue)) {
          // setDfnnMobileError(true);
          return;
        }
        sessionStorage.setItem('phoneNumber', mobileValue);
        sessionStorage.setItem('checkoutWallet', selectedWalletValue);
        sessionStorage.setItem('selectedWalletName', selectedWalletName);
        sessionStorage.setItem('selectedWalletValue', selectedWalletValue);
        sessionStorage.setItem('paymentAmount', 'PHP 500');
        sessionStorage.setItem('paymentMethod', 'dfnn-wallet');
        const currentLang = document.documentElement.getAttribute('lang') || sessionStorage.getItem('selectedLanguage') || 'en';
        sessionStorage.setItem('selectedLanguage', currentLang === 'tl' ? 'tl' : 'en');
        window.location.href = 'iframe.html';
      });
    }

    // Easypaisa Simpesa -  note:
    // Dynamic routing by payment method: Easypaisa stores method context and redirects to OTP flow.
    const easypaisaPayButton = document.getElementById('mpesaPayButton');
    if (easypaisaPayButton) {
      easypaisaPayButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (easypaisaPayButton.disabled) {
          return;
        }
        const easypaisaInput = document.getElementById('easypaisaInput');
        const mobileValue = easypaisaInput ? easypaisaInput.value.trim() : '';
        if (!mobileValue || !validatePhoneNumber(mobileValue)) {
          setEasypaisaMobileError(true);
          return;
        }
        sessionStorage.setItem('phoneNumber', mobileValue);
        sessionStorage.setItem('easypaisaNumber', mobileValue);
        sessionStorage.setItem('checkoutWallet', 'easypaisa');
        sessionStorage.setItem('cardNumber', mobileValue);
        sessionStorage.setItem('paymentAmount', 'PKR 500.00');
        window.location.href = 'otp-page.html';
      });
    }

    // JazzCash Wallet Simpaisa -  note:
    // JazzCash pay action routes to waiting page with JazzCash wallet context.
    const jazzcashPayButton = document.getElementById('jazzcashPayButton');
    if (jazzcashPayButton) {
      jazzcashPayButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (jazzcashPayButton.disabled) {
          return;
        }
        const jazzcashInput = document.getElementById('jazzcashInput');
        const mobileValue = jazzcashInput ? jazzcashInput.value.trim() : '';
        if (!mobileValue || !validatePhoneNumber(mobileValue)) {
          setJazzcashMobileError(true);
          return;
        }
        sessionStorage.setItem('phoneNumber', mobileValue);
        sessionStorage.setItem('jazzcashNumber', mobileValue);
        sessionStorage.removeItem('easypaisaNumber');
        sessionStorage.setItem('checkoutWallet', 'jazzcash');
        sessionStorage.setItem('paymentAmount', 'PKR 500.00');
        window.location.href = 'waiting.html';
      });
    }

    // BANK DEPOSIT - NIGERIA: Show Bank Details routes to details page.
    const nigeriaBankDepositButton = document.getElementById('nigeriaBankDepositButton');
    if (nigeriaBankDepositButton) {
      nigeriaBankDepositButton.addEventListener('click', function(e) {
        e.preventDefault();
        const selectedLanguage = sessionStorage.getItem('selectedLanguage') || 'en';
        sessionStorage.setItem('paymentMethod', 'nigeria-bank-deposit');
        if (NIGERIA_BANK_DEPOSIT_LANGS.includes(selectedLanguage)) {
          sessionStorage.setItem('selectedLanguage', selectedLanguage);
        } else {
          sessionStorage.setItem('selectedLanguage', 'en');
        }
        window.location.href = 'details.html';
      });
    }

    const philippinesVcaShowPaymentDetailsButton = document.getElementById('philippinesVcaShowPaymentDetailsButton');
    if (philippinesVcaShowPaymentDetailsButton) {
      philippinesVcaShowPaymentDetailsButton.addEventListener('click', function(e) {
        e.preventDefault();
        const selectedLanguage = sessionStorage.getItem('selectedLanguage') || 'en';
        sessionStorage.setItem('paymentMethod', 'philippines-vca-bank-transfer');
        if (selectedLanguage === 'en' || selectedLanguage === 'tl') {
          sessionStorage.setItem('selectedLanguage', selectedLanguage);
        } else {
          sessionStorage.setItem('selectedLanguage', 'en');
        }
        window.location.href = 'details.html';
      });
    }

    const showQRButton = document.getElementById('showQRButton');
    if (showQRButton) {
      showQRButton.addEventListener('click', handleShowQRClick);
    }

    const philippinesQrphShowQRButton = document.getElementById('philippinesQrphShowQRButton');
    if (philippinesQrphShowQRButton) {
      philippinesQrphShowQRButton.addEventListener('click', handlePhilippinesQrphShowQRClick);
    }

    if (document.body && document.body.classList.contains('ph-qr-page')) {
      preparePhilippinesQrphDownloadLink();
    }

    // UPI (India) flow: Show QR button on ALT accordion
    const showALTQRButton = document.getElementById('showALTQRButton');
    if (showALTQRButton) {
      showALTQRButton.addEventListener('click', handleAltShowQRClick);
    }

    const openUpiAppTargets = document.querySelectorAll('[data-open-app]');
    openUpiAppTargets.forEach(target => {
      target.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof target.blur === 'function') {
          target.blur();
        }
        const appKey = target.getAttribute('data-open-app');
        // event: Payment Method Click (UPI (India) flow: only the ALT flow is tracked)
        const isAlt = isAltUpiInteraction(target);
        if (isAlt) {
          trackEvent('Payment Method Click', {
            page: getTrackedPageName(),
            method: getPaymentMethodLabel(appKey),
            order_id: getTrackedOrderId(),
            provider: 'alt'
          });
        }
        attemptOpenUpiNativeApp(appKey, isAlt);
      });
    });

    const scrollHints = document.querySelectorAll('.scroll-down-hint');
    if (scrollHints.length) {
      const updateScrollHints = () => {
        const hasMoreBelow = (window.scrollY + window.innerHeight) < (document.documentElement.scrollHeight - 80);
        scrollHints.forEach((hint) => {
          hint.classList.toggle('is-hidden', !hasMoreBelow || window.scrollY > 48);
        });
      };
      updateScrollHints();
      window.addEventListener('scroll', updateScrollHints, { passive: true });
      window.addEventListener('resize', updateScrollHints);
    }

    const upiQrCollapseElement = document.getElementById('collapseUPIQR');
    // UPI (India) flow: ALT UPI QR accordion
    const altUpiQrCollapseElement = document.getElementById('collapseALTUPIQR');
    const upiCollapseElement = document.getElementById('collapseUPI');
    const netBankingCollapseElement = document.getElementById('collapseThree');
    const banWalletsCollapseElement = document.getElementById('collapseBanWallets');
    const dfnnWalletsCollapseElement = document.getElementById('collapseDfnnWallets');
    const philippinesQrphCollapseElement = document.getElementById('collapsePhilippinesQrph');
    const philippinesVcaBankTransferCollapseElement = document.getElementById('collapsePhilippinesVcaBankTransfer');
    const easypaisaCollapseElement = document.getElementById('collapseEasypaisa');
    const jazzcashCollapseElement = document.getElementById('collapseJazzCash');
    const nigeriaBankDepositCollapseElement = document.getElementById('collapseBankDepositNigeria');
    const hasCheckoutAccordions = !!(upiQrCollapseElement || altUpiQrCollapseElement || upiCollapseElement || netBankingCollapseElement || banWalletsCollapseElement || dfnnWalletsCollapseElement || philippinesQrphCollapseElement || philippinesVcaBankTransferCollapseElement || easypaisaCollapseElement || jazzcashCollapseElement || nigeriaBankDepositCollapseElement);
    let pendingHindiResetTimeout = null;
    const clearMobileUpiRowFocus = function() {
      const upiRows = document.querySelectorAll('.mobile-upi-method-row');
      upiRows.forEach((row) => {
        if (typeof row.blur === 'function') {
          row.blur();
        }
      });
    };
    const secondaryLanguagePill = hasCheckoutAccordions
      ? document.querySelector('.language-pill[data-lang="ar"], .language-pill[data-lang="hi"], .language-pill[data-lang="bn"], .language-pill[data-lang="ur"], .language-pill[data-lang="tl"]')
      : null;
    const setSecondaryLanguagePill = function(langCode, label) {
      if (!secondaryLanguagePill) {
        return;
      }
      secondaryLanguagePill.setAttribute('data-lang', langCode);
      secondaryLanguagePill.textContent = label;
    };
    const toggleUpiQrExpandedMode = function() {
      const isUpiQrExpanded = !!(upiQrCollapseElement && upiQrCollapseElement.classList.contains('show'));
      const isAltUpiQrExpanded = !!(altUpiQrCollapseElement && altUpiQrCollapseElement.classList.contains('show'));
      const isUpiExpanded = !!(upiCollapseElement && upiCollapseElement.classList.contains('show'));
      const isNetBankingExpanded = !!(netBankingCollapseElement && netBankingCollapseElement.classList.contains('show'));
      const isBanWalletsExpanded = !!(banWalletsCollapseElement && banWalletsCollapseElement.classList.contains('show'));
      const isDfnnWalletsExpanded = !!(dfnnWalletsCollapseElement && dfnnWalletsCollapseElement.classList.contains('show'));
      const isPhilippinesQrphExpanded = !!(philippinesQrphCollapseElement && philippinesQrphCollapseElement.classList.contains('show'));
      const isPhilippinesVcaBankTransferExpanded = !!(philippinesVcaBankTransferCollapseElement && philippinesVcaBankTransferCollapseElement.classList.contains('show'));
      const isEasypaisaExpanded = !!(easypaisaCollapseElement && easypaisaCollapseElement.classList.contains('show'));
      const isJazzcashExpanded = !!(jazzcashCollapseElement && jazzcashCollapseElement.classList.contains('show'));
      const isNigeriaBankDepositExpanded = !!(nigeriaBankDepositCollapseElement && nigeriaBankDepositCollapseElement.classList.contains('show'));
      const isAnyIndiaXmFlowExpanded = isUpiQrExpanded || isUpiExpanded || isNetBankingExpanded;
      // UPI (India) flow: Hindi pill support without merchant header expanded mode
      const isAnyIndiaUpiFlowExpanded = isAnyIndiaXmFlowExpanded || isAltUpiQrExpanded;
      toggleNigeriaBankDepositLanguagePills();
      const currentLang = document.documentElement.getAttribute('lang') || 'en';
      if (pendingHindiResetTimeout) {
        clearTimeout(pendingHindiResetTimeout);
        pendingHindiResetTimeout = null;
      }
      if (isAnyIndiaUpiFlowExpanded && currentLang === 'ar' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (isDfnnWalletsExpanded && currentLang === 'ar' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (isPhilippinesQrphExpanded && currentLang === 'ar' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (isPhilippinesVcaBankTransferExpanded && currentLang === 'ar' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (isBanWalletsExpanded && currentLang !== 'en' && currentLang !== 'bn' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (isDfnnWalletsExpanded && currentLang !== 'en' && currentLang !== 'tl' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (isPhilippinesQrphExpanded && currentLang !== 'en' && currentLang !== 'tl' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (isPhilippinesVcaBankTransferExpanded && currentLang !== 'en' && currentLang !== 'tl' && typeof switchLanguage === 'function') {
        switchLanguage('en');
      }
      if (!isAnyIndiaUpiFlowExpanded && !isBanWalletsExpanded && !isDfnnWalletsExpanded && !isPhilippinesQrphExpanded && !isPhilippinesVcaBankTransferExpanded && !isEasypaisaExpanded && !isJazzcashExpanded && !isNigeriaBankDepositExpanded && (currentLang === 'hi' || currentLang === 'bn' || currentLang === 'ur' || currentLang === 'tl' || currentLang === 'yo' || currentLang === 'ig' || currentLang === 'ha') && typeof switchLanguage === 'function') {
        pendingHindiResetTimeout = setTimeout(() => {
          const upiQrStillExpanded = !!(upiQrCollapseElement && upiQrCollapseElement.classList.contains('show'));
          const altUpiQrStillExpanded = !!(altUpiQrCollapseElement && altUpiQrCollapseElement.classList.contains('show'));
          const upiStillExpanded = !!(upiCollapseElement && upiCollapseElement.classList.contains('show'));
          const netBankingStillExpanded = !!(netBankingCollapseElement && netBankingCollapseElement.classList.contains('show'));
          const banWalletsStillExpanded = !!(banWalletsCollapseElement && banWalletsCollapseElement.classList.contains('show'));
          const dfnnWalletsStillExpanded = !!(dfnnWalletsCollapseElement && dfnnWalletsCollapseElement.classList.contains('show'));
          const philippinesQrphStillExpanded = !!(philippinesQrphCollapseElement && philippinesQrphCollapseElement.classList.contains('show'));
          const philippinesVcaBankTransferStillExpanded = !!(philippinesVcaBankTransferCollapseElement && philippinesVcaBankTransferCollapseElement.classList.contains('show'));
          const easypaisaStillExpanded = !!(easypaisaCollapseElement && easypaisaCollapseElement.classList.contains('show'));
          const jazzcashStillExpanded = !!(jazzcashCollapseElement && jazzcashCollapseElement.classList.contains('show'));
          const nigeriaBankDepositStillExpanded = !!(nigeriaBankDepositCollapseElement && nigeriaBankDepositCollapseElement.classList.contains('show'));
          if (!upiQrStillExpanded && !altUpiQrStillExpanded && !upiStillExpanded && !netBankingStillExpanded && !banWalletsStillExpanded && !dfnnWalletsStillExpanded && !philippinesQrphStillExpanded && !philippinesVcaBankTransferStillExpanded && !easypaisaStillExpanded && !jazzcashStillExpanded && !nigeriaBankDepositStillExpanded) {
            switchLanguage('en');
          }
          pendingHindiResetTimeout = null;
        }, 120);
      }
      if (isUpiQrExpanded || isAltUpiQrExpanded) {
        clearMobileUpiRowFocus();
      }
      // UPI (India) flow: hide expiry header; does not enable merchant logo header swap
      document.body.classList.toggle('upi-qr-expanded-mode', isAnyIndiaXmFlowExpanded);
      // UPI (India) flow: stack English/Hindi pills below title on mobile checkout
      const isAltUpiQrMobileExpanded = isAltUpiQrExpanded && window.matchMedia('(max-width: 520px)').matches;
      document.body.classList.toggle('alt-upi-qr-expanded-mode', isAltUpiQrMobileExpanded);

      // Pakistan Simpesa wallets tech note:
      // Hide the checkout "Expires in" header for Easypaisa, JazzCash, and ALT UPI QR accordions.
      const expiresInHeader = document.getElementById('checkoutExpiresInHeader');
      if (expiresInHeader) {
        expiresInHeader.classList.toggle('d-none', isEasypaisaExpanded || isJazzcashExpanded || isAltUpiQrExpanded);
      }

      if (!isNigeriaBankDepositExpanded) {
        if (isBanWalletsExpanded) {
          setSecondaryLanguagePill('bn', 'বাংলা');
        } else if (isEasypaisaExpanded || isJazzcashExpanded) {
          setSecondaryLanguagePill('ur', 'اردو');
        } else if (isAnyIndiaUpiFlowExpanded) {
          setSecondaryLanguagePill('hi', 'हिंदी');
        } else if (isDfnnWalletsExpanded || isPhilippinesQrphExpanded || isPhilippinesVcaBankTransferExpanded) {
          setSecondaryLanguagePill('tl', 'Tagalog');
        } else {
          setSecondaryLanguagePill('ar', 'العربية');
        }
      }
    };
    if (upiQrCollapseElement) {
      upiQrCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      upiQrCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (altUpiQrCollapseElement) {
      // UPI (India) flow: accordion expand/collapse handlers
      altUpiQrCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      altUpiQrCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (upiCollapseElement) {
      upiCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      upiCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (netBankingCollapseElement) {
      netBankingCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      netBankingCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (banWalletsCollapseElement) {
      banWalletsCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      banWalletsCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (dfnnWalletsCollapseElement) {
      dfnnWalletsCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      dfnnWalletsCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (philippinesQrphCollapseElement) {
      philippinesQrphCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      philippinesQrphCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (philippinesVcaBankTransferCollapseElement) {
      philippinesVcaBankTransferCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      philippinesVcaBankTransferCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (easypaisaCollapseElement) {
      easypaisaCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      easypaisaCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (jazzcashCollapseElement) {
      jazzcashCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      jazzcashCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (nigeriaBankDepositCollapseElement) {
      nigeriaBankDepositCollapseElement.addEventListener('shown.bs.collapse', toggleUpiQrExpandedMode);
      nigeriaBankDepositCollapseElement.addEventListener('hidden.bs.collapse', toggleUpiQrExpandedMode);
    }
    if (hasCheckoutAccordions) {
      toggleUpiQrExpandedMode();
      // UPI (India) flow: keep mobile header layout in sync on resize
      window.addEventListener('resize', toggleUpiQrExpandedMode);
    }

    initializeUPIInput();
    initializeIndiaNetBanking();

  });