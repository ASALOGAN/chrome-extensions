importScripts("crypto.js");
console.log("Edcite Login Assistant service worker started.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_LOGIN") {
    handleStartLogin(message, sendResponse);
    return true;
  }

  console.warn("Unknown message type:", message.type);

  return false;
});

async function handleStartLogin(message, sendResponse) {
  const { loginUrl, username } = message;
  const baseUrl = loginUrl.replace(/\/usr\/(?:sign\.html|signin\.html|logincheck).*$/, "").replace(/\/$/, "");
  const redirectQuery = message.redirect ? `?redirect=${encodeURIComponent(message.redirect)}` : "";
  const usernameUrl = `${baseUrl}/usr/signin.html${redirectQuery}`;

  console.log("Starting login for:", username);

  if (!loginUrl) {
    sendResponse({
      success: false,
      error: "Login URL is missing.",
    });

    return;
  }

  if (!username) {
    sendResponse({
      success: false,
      error: "Username and password are required.",
    });

    return;
  }

  const stored = await chrome.storage.local.get("servers");
  const user = stored.servers?.[message.environmentId]?.users?.[message.userId];
  if (!user?.password) {
    sendResponse({ success: false, error: "Stored password is missing." });
    return;
  }
  const password = await decryptPassword(user.password);

  if (typeof user.password === "string") {
    user.password = await encryptPassword(user.password);
    await chrome.storage.local.set({ servers: stored.servers });
  }

  try {
    // 1. Open login page
    console.log("Opening login URL:", loginUrl);

    const tab = await chrome.tabs.create({
      url: usernameUrl,
    });

    if (!tab?.id) {
      throw new Error("Chrome did not return a tab ID.");
    }

    const tabId = tab.id;

    console.log("Login tab created:", tabId);

    // 2. Wait for login page to finish loading
    await waitForTabLoad(tabId);

    console.log("Login page finished loading.");

    // 3. Fill the user ID. Clicking Next navigates to /usr/logincheck.
    console.log("Injecting username automation...");

    const results = await chrome.scripting.executeScript({
      target: {
        tabId,
      },
      func: fillUsername,
      args: [username],
    });

    const result = results?.[0]?.result;

    console.log("Username automation result:", result);

    if (!result?.success) {
      sendResponse({
        success: false,
        error: result?.error || "Login automation failed.",
      });

      return;
    }

    await waitForPasswordField(tabId);

    const passwordResults = await chrome.scripting.executeScript({
      target: { tabId },
      func: fillPassword,
      args: [password],
    });
    const passwordResult = passwordResults?.[0]?.result;
    if (!passwordResult?.success) {
      sendResponse({ success: false, error: passwordResult?.error || "Password automation failed." });
      return;
    }
    sendResponse({ success: true, tabId });
  } catch (error) {
    console.error("Login flow failed:", error);

    sendResponse({
      success: false,
      error: error.message || "Unable to complete login.",
    });
  }
}

function waitForTabLoad(tabId, timeout = 15000) {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const cleanup = () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);

      clearTimeout(timeoutId);
    };

    const handleTabUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId !== tabId) {
        return;
      }

      console.log("Tab updated:", updatedTabId, changeInfo);

      if (changeInfo.status === "complete") {
        resolved = true;

        cleanup();
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    chrome.tabs.get(tabId, (currentTab) => {
      if (chrome.runtime.lastError) return;
      if (currentTab?.status === "complete") {
        resolved = true;
        cleanup();
        resolve();
      }
    });

    const timeoutId = setTimeout(() => {
      if (resolved) {
        return;
      }

      cleanup();

      reject(new Error("Timed out waiting for login page to load."));
    }, timeout);
  });
}

async function waitForPasswordField(tabId, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => Boolean(document.querySelector("#password")),
      });
      if (result?.[0]?.result) return;
    } catch (error) {
      // The page may be navigating; retry until the password page is available.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the password page at /usr/logincheck.");
}

async function fillUsername(username) {
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const existingElement = document.querySelector(selector);

      if (existingElement) {
        resolve(existingElement);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);

        if (!element) {
          return;
        }

        observer.disconnect();
        resolve(element);
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();

        reject(new Error(`Timed out waiting for ${selector}`));
      }, timeout);
    });
  }

  try {
    console.log("Login automation started.");

    const usernameInput = await waitForElement("#userid");

    usernameInput.focus();
    usernameInput.value = username;

    usernameInput.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    usernameInput.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );

    console.log("Username entered.");

    const nextButton = await waitForElement("#nextBtn");

    nextButton.click();

    console.log("Next button clicked.");

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function fillPassword(password) {
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const existingElement = document.querySelector(selector);
      if (existingElement) return resolve(existingElement);
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (!element) return;
        observer.disconnect();
        resolve(element);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error(`Timed out waiting for ${selector}`)); }, timeout);
    });
  }

  try {
    const passwordInput = await waitForElement("#password");

    passwordInput.focus();
    passwordInput.value = password;

    passwordInput.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    passwordInput.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );

    console.log("Password field populated.");

    const loginButton = await waitForElement("#loginBtn");

    loginButton.click();

    return { success: true };
  } catch (error) {
    console.error("Login automation failed:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}
