(function () {
  "use strict";

  var key = "publit-site-analytics-consent";
  var siteId = "1";
  var consent = null;
  var trackerLoaded = false;

  function loadTracker() {
    if (trackerLoaded) {
      window._paq.push(["setCustomUrl", location.origin + location.pathname]);
      window._paq.push(["trackPageView"]);
      return;
    }

    var queue = (window._paq = window._paq || []);
    queue.push(["disableCookies"]);
    queue.push(["setDoNotTrack", true]);
    queue.push(["setTrackerUrl", "/matomo.php"]);
    queue.push(["setSiteId", siteId]);
    queue.push(["setCustomUrl", location.origin + location.pathname]);
    queue.push(["trackPageView"]);

    var script = document.createElement("script");
    script.async = true;
    script.src = "/matomo.js";
    script.id = "matomo-tracker";
    document.head.appendChild(script);
    trackerLoaded = true;
  }

  function makeButton(text, action, primary) {
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = primary ? "pc-consent-primary" : "pc-consent-secondary";
    button.addEventListener("click", action);
    return button;
  }

  function render() {
    var old = document.getElementById("publit-analytics-consent");
    if (old) old.remove();
    var panel = document.createElement("aside");
    panel.id = "publit-analytics-consent";
    panel.setAttribute("aria-label", "Privacy settings");

    if (consent) {
      panel.className = "pc-consent-settings";
      panel.appendChild(makeButton(
        document.documentElement.lang === "de" ? "Datenschutzeinstellungen" : "Privacy settings",
        function () { consent = null; try { localStorage.removeItem(key); } catch (_) {} render(); },
        false
      ));
    } else {
      panel.className = "pc-consent-panel";
      var text = document.createElement("p");
      text.textContent = document.documentElement.lang === "de"
        ? "Darf Publit anonyme Besuchsstatistiken mit Matomo auf dem eigenen Server erfassen? Es werden keine Tracking-Cookies gesetzt."
        : "May Publit collect anonymous visit statistics with Matomo on its own server? No tracking cookies are used.";
      panel.appendChild(text);
      var actions = document.createElement("div");
      actions.className = "pc-consent-actions";
      actions.appendChild(makeButton(document.documentElement.lang === "de" ? "Erlauben" : "Allow", function () {
        consent = "accepted";
        try { localStorage.setItem(key, consent); } catch (_) {}
        render();
        loadTracker();
      }, true));
      actions.appendChild(makeButton(document.documentElement.lang === "de" ? "Ablehnen" : "Decline", function () {
        consent = "declined";
        try { localStorage.setItem(key, consent); } catch (_) {}
        render();
      }, false));
      var privacy = document.createElement("a");
      privacy.href = "/privacy/#analytics";
      privacy.textContent = document.documentElement.lang === "de" ? "Datenschutz" : "Privacy";
      actions.appendChild(privacy);
      panel.appendChild(actions);
    }
    document.body.appendChild(panel);
  }

  var style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/analytics-consent.css";
  document.head.appendChild(style);

  try {
    var saved = localStorage.getItem(key);
    if (saved === "accepted" || saved === "declined") consent = saved;
  } catch (_) {}

  render();
  if (consent === "accepted") loadTracker();
})();
