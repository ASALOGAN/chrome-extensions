console.log("Page Inspector service worker started.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "INSPECT_PAGE") {
    return;
  }

  const { tabId } = message;

  if (!tabId) {
    sendResponse({
      success: false,
      error: "No tab ID provided.",
    });

    return;
  }

  chrome.tabs
    .sendMessage(tabId, {
      type: "INSPECT_PAGE",
    })
    .then((response) => {
      sendResponse({
        success: true,
        data: response,
      });
    })
    .catch((error) => {
      console.error("Content script error:", error);

      sendResponse({
        success: false,
        error: "Unable to communicate with the webpage.",
      });
    });

  return true;
});
