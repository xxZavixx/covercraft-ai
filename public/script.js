document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  // Unlock Pro if redirected from PayPal thank-you page
  if (params.get("pro") === "1") {
    localStorage.setItem("isProUser", "true");
    localStorage.setItem("allowManualUnlock", "true"); // allow future unlock visibility
    alert("Thank you for upgrading to CoverCraft Pro!");
    const countMsg = document.getElementById("genCountMsg");
    if (countMsg) countMsg.textContent = "Pro access unlocked.";
    history.replaceState({}, document.title, window.location.pathname); // Clean URL
  }

  // Initialize free try count only if never set
  if (!localStorage.getItem("coverTries")) {
    localStorage.setItem("coverTries", "0");
  }

  const isPro = localStorage.getItem("isProUser") === "true";
  const allowManualUnlock = localStorage.getItem("allowManualUnlock") === "true";
  const tries = parseInt(localStorage.getItem("coverTries") || "0");
  const countMsg = document.getElementById("genCountMsg");

  // Update usage counter
  if (countMsg) {
    if (isPro) {
      countMsg.textContent = "Pro access unlocked.";
    } else {
      countMsg.textContent = `${tries}/2 free uses used.`;
    }
  }

  // Only show manual unlock link if allowed
  const manualWrapper = document.getElementById("manualUnlockWrapper");
  if (manualWrapper && allowManualUnlock) {
    manualWrapper.style.display = "block";
  }
});

document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const isPro = localStorage.getItem("isProUser") === "true";
  let tries = parseInt(localStorage.getItem("coverTries") || "0");

  // Block free users over the limit
  if (!isPro && tries >= 2) {
    alert("You've reached your free limit. Please upgrade to CoverCraft Pro.");
    document.getElementById("paypal-container-2S7SD3LJNS3VW")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const formData = new FormData(e.target);
  const userInput = Object.fromEntries(formData.entries());

  const resultBox = document.getElementById("resultBox");
  resultBox.textContent = "Generating your cover letter... Please wait.";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userInput)
    });

    const data = await response.json();

    if (response.ok && data.output) {
      resultBox.textContent = data.output;

      // Update free tries
      if (!isPro) {
        tries++;
        localStorage.setItem("coverTries", tries.toString());
        const countMsg = document.getElementById("genCountMsg");
        if (countMsg) {
          countMsg.textContent = `${tries}/2 free uses used.`;
        }
      }
    } else {
      resultBox.textContent = data.error || "Something went wrong generating your cover letter.";
    }
  } catch (error) {
    console.error("API call error:", error);
    resultBox.textContent = "Network error. Please try again later.";
  }
});