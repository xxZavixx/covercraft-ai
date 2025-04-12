document.addEventListener("DOMContentLoaded", async () => {
  const emailInput = document.getElementById("userEmail");
  const countMsg = document.getElementById("genCountMsg");

  // If redirected from PayPal with Pro access
  const params = new URLSearchParams(window.location.search);
  if (params.get("pro") === "1") {
    localStorage.setItem("allowManualUnlock", "true");
    alert("Thank you for upgrading to CoverCraft Pro!");
    history.replaceState({}, document.title, window.location.pathname);
  }

  // Show manual unlock option
  const allowManualUnlock = localStorage.getItem("allowManualUnlock") === "true";
  const manualWrapper = document.getElementById("manualUnlockWrapper");
  if (manualWrapper && allowManualUnlock) {
    manualWrapper.style.display = "block";
  }

  // Manual unlock form
  document.getElementById("emailUnlockForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("unlockStatus");
    const email = e.target.email.value.trim().toLowerCase();

    if (!email) {
      status.textContent = "Please enter a valid email.";
      return;
    }

    status.textContent = "Checking...";

    try {
      const res = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok && data.credits >= 1) {
        localStorage.setItem("userEmail", email);
        status.textContent = "✅ Pro access restored. You may now generate.";
        if (countMsg) countMsg.textContent = `${data.credits} credits remaining.`;
      } else {
        status.textContent = "❌ No credits found for that email.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "❌ Error checking credits.";
    }
  });

  // Auto-load stored email and display credit count
  const storedEmail = localStorage.getItem("userEmail");
  if (storedEmail && emailInput) {
    emailInput.value = storedEmail;
    try {
      const res = await fetch(`/api/check-credits?email=${encodeURIComponent(storedEmail)}`);
      const data = await res.json();
      if (res.ok && typeof data.credits === "number") {
        countMsg.textContent = `${data.credits} credits remaining.`;
      }
    } catch (error) {
      console.warn("Could not fetch credits.");
    }
  }
});

// Main form submission
document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("userEmail");
  const email = emailInput?.value?.trim().toLowerCase();

  if (!email) {
    alert("Please enter your email to continue.");
    emailInput?.focus();
    return;
  }

  localStorage.setItem("userEmail", email);

  // Check credits before generating
  const checkRes = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
  const creditData = await checkRes.json();

  if (!checkRes.ok || !creditData.credits || creditData.credits <= 0) {
    alert("You’ve used all your free or purchased credits. Please buy more.");
    document.getElementById("paypal-container-2S7SD3LJNS3VW")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const formData = new FormData(e.target);
  const userInput = Object.fromEntries(formData.entries());
  const resultBox = document.getElementById("resultBox");
  resultBox.textContent = "Generating your cover letter... Please wait.";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInput)
    });

    const data = await response.json();

    if (response.ok && data.output) {
      resultBox.textContent = data.output;

      // Use a credit
      await fetch("/api/use-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      // Refresh credit count
      const refreshRes = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
      const refreshData = await refreshRes.json();
      const countMsg = document.getElementById("genCountMsg");
      if (countMsg && typeof refreshData.credits === "number") {
        countMsg.textContent = `${refreshData.credits} credits remaining.`;
      }
    } else {
      resultBox.textContent = data.error || "Something went wrong generating your cover letter.";
    }
  } catch (error) {
    console.error("API call error:", error);
    resultBox.textContent = "Network error. Please try again later.";
  }
});