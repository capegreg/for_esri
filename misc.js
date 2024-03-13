function detectSupportedDevice() {
  let supported = true;

  // ************************************************************
  // layout viewport - the area which is available to be seen.
  // ************************************************************

  // ************************************************************
  // innerWidth and innerHeight properties.
  // supported by all browsers.
  // ************************************************************

  // innerWidth returns interior width of the window in pixels
  // (including the width of the scroll bar, if one is present).
  let viewportWidth = window.innerWidth;

  // innerHeight returns interior height of the window in pixels
  // (including the height of the scroll bar, if one is present).
  let viewportHeight = window.innerHeight;

  // ************************************************************
  // outerWidth and outerHeight properties.
  // supported by all browsers.
  // ************************************************************

  // outerWidth returns width of the outside of the browser window.
  // It represents the width of the whole browser window including 
  // sidebar (if expanded), window chrome and window resizing 
  // borders/handles.
  let browserWidth = window.outerWidth;

  // outerHeight returns the height in pixels of the whole browser window, 
  // including any sidebar, window chrome, and window-resizing borders/handles.
  let browserHeight = window.outerHeight;

  // **********************************************************
  // Device size, screen or display size.
  // This is the size of an actual area of the device where
  // users see the content. Unlike viewport or document size
  // the values of the screen (display) remain unaltered.
  // Use window.screen Screen API property to get the size of the screen.
  // The screen property returns object data about the current screen.
  // **********************************************************
  let screenWidth = window.screen.width;
  let screenHeight = window.screen.height;

  // **********************************************************
  // clientWidth and clientSize
  // **********************************************************

  // **********************************************************
  //  Test that media queries are supported in general
  //  Note that if the browser does not support media 
  //  queries (e.g. old IE) mq will always return false.
  // **********************************************************
  // Modernizr.mq('only all'); // true if MQ are supported, false if not

  // let query = Modernizr.mq('(min-width: 1023px)');
  // if (query) {
  //     supported = false;
  // }
  // query = Modernizr.mq('(min-height: 767px)');
  // if (query) {
  //     supported = false;
  // }
  // if (Modernizr.touchevents) {
  // }
  // if (Modernizr.pointerevents) {
  // }

  return viewportWidth >= 1024 && viewportHeight >= 768;
}

function detectMobileDevice() {

    // for chromium client hints
    let a = navigator?.userAgentData;
    if (a) return a.mobile;

    // for browsers not supporting client hints
    if (Modernizr && Modernizr.touchevents) {
        var UA = navigator.userAgent;
        return (/\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) || /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA));
    }
    return false;
}

window.getFullscreenApiSupport = function () {
    /* ************************************************************************************************************************ 
        Standard								WebKit (Safari) / Blink		Gecko (Firefox)         Internet Explorer
                                                (Chrome & Opera) / Edge	
    -----------------------------------------------------------------------------------------------------------------------------	
        Document.fullscreen						webkitIsFullScreen			mozFullScreen					X
        Document.fullscreenEnabled				webkitFullscreenEnabled     mozFullScreenEnabled	msFullscreenEnabled
        DocumentOrShadowRoot.fullscreenElement	webkitFullscreenElement		mozFullScreenElement	msFullscreenElement
        Document.onfullscreenchange				onwebkitfullscreenchange	onmozfullscreenchange	onMSFullscreenChange
        Document.onfullscreenerror				onwebkitfullscreenerror		onmozfullscreenerror	onMSFullscreenError
        Document.exitFullscreen()				webkitExitFullscreen()		mozCancelFullScreen()	msExitFullscreen()
        Element.requestFullscreen()				webkitRequestFullscreen()	mozRequestFullScreen()	msRequestFullscreen()
    ************************************************************************************************************************ */
    let agent = getUserAgent();
    let tf = true;
    switch (agent) {
        case "WebKit":
            if (document.webkitFullscreenEnabled) {
                paoDetails.support.fullscreenApi = "WebKit";
                //console.log('Full screen API: WebKit');
            }
            break;
        case "Gecko":
            if (document.mozFullScreenEnabled) {
                paoDetails.support.fullscreenApi = "Gecko";
                //console.log('Full screen API: Gecko');
            }
            break;
        case "IE":
            if (document.msFullscreenEnabled) {
                paoDetails.support.fullscreenApi = "IE";
                //console.log('Full screen API: IE');
            }
            break;
        case "Unknown":
            if (document.fullscreen || document.fullscreenEnabled) {
                paoDetails.support.fullscreenApi = "Unknown";
                //console.log('Full screen API: Unknown');
            }
            break;
        default:
            paoDetails.support.fullscreenApi = "Not Supported";
            //console.log('Full screen API: Not supported.');
            paoDetails.support.fullscreenSupported = false;
            tf = false;
    }
    return tf;
};

function getUserAgent() {

    var sUsrAg = navigator.userAgent;
    // The order matters here, and this may report false positives for unlisted browsers.
    if (sUsrAg.indexOf("Firefox") > -1) {
        return "Gecko";
        // "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:63.0) Gecko/20100101 Firefox/63.0"
        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0"
    } else if (sUsrAg.indexOf("Opera") > -1 || sUsrAg.indexOf("OPR") > -1) {
        return "WebKit";
        //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 OPR/57.0.3098.106"
    } else if (sUsrAg.indexOf("Trident") > -1) {
        return "IE";
        // "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; Zoom 3.6.0; rv:11.0) like Gecko"
    } else if (sUsrAg.indexOf("Edge") > -1) {
        return "WebKit";
        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
    } else if (sUsrAg.indexOf("Chromium") > -1) {
        return "WebKit";
        // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
    } else if (sUsrAg.indexOf("Safari") > -1) {
        return "WebKit";
        // "Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
    } else if (sUsrAg.indexOf("Microsoft") > -1) {
        return 'Gecko';
        // Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0
    } else {
        return "Unknown"; // maybe Standard
    }
}