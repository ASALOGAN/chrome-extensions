console.log("Page Inspector content script loaded.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "INSPECT_PAGE") {
    return;
  }

  const pageInfo = {
    title: document.title,
    url: window.location.href,
    hostname: window.location.hostname,
    wordCount:
      document.body?.innerText?.trim().split(/\s+/).filter(Boolean).length || 0,
    links: document.querySelectorAll("a").length,
    images: document.querySelectorAll("img").length,
  };

  sendResponse(pageInfo);
});
