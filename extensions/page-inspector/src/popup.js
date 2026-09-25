const inspectButton = document.getElementById("inspectButton");
const status = document.getElementById("status");
const result = document.getElementById("result");

inspectButton.addEventListener("click", async () => {
  status.textContent = "Inspecting...";
  result.hidden = true;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      throw new Error("Unable to find the active tab.");
    }

    const response = await chrome.runtime.sendMessage({
      type: "INSPECT_PAGE",
      tabId: tab.id,
    });

    if (!response?.success) {
      throw new Error(response?.error || "Inspection failed.");
    }

    const pageInfo = response.data;

    document.getElementById("title").textContent = pageInfo.title;
    document.getElementById("hostname").textContent = pageInfo.hostname;
    document.getElementById("wordCount").textContent = pageInfo.wordCount;
    document.getElementById("links").textContent = pageInfo.links;
    document.getElementById("images").textContent = pageInfo.images;

    result.hidden = false;
    status.textContent = "";
  } catch (error) {
    console.error(error);
    status.textContent = error.message || "Unable to inspect this page.";
  }
});
