document.addEventListener("DOMContentLoaded", async () => {
  const emailInput = document.getElementById("userEmail");
  const countMsg = document.getElementById("genCountMsg");

  // If redirected from PayPal
  const params = new URLSearchParams(window.location.search);
  if (params.get("pro") === "1") {
    localStorage.setItem("allowManualUnlock", "true");
    alert("Thank you for upgrading to CoverCraft Pro!");
    history.replaceState({}, document.title, window.location.pathname);
  }

  // Show manual unlock if allowed
  const allowManualUnlock = localStorage.getItem("allowManualUnlock") === "true";
  const manualWrapper = document.getElementById("manualUnlockWrapper");
  if (manualWrapper && allowManualUnlock) {
    manualWrapper.style.display = "block";
  }

  // Listen for manual unlock form submission
  document.getElementById("emailUnlockForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("unlockStatus");
    const email = e.target.email.value.trim().toLowerCase();
    status.textContent = "Checking...";

    const res = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (res.ok && data.credits >= 1) {
      localStorage.setItem("userEmail", email);
      status.textContent = "✅ Pro access restored. You may generate now.";
      if (countMsg) countMsg.textContent = `${data.credits} credits remaining.`;
    } else {
      status.textContent = "❌ No credits found for that email.";
    }
  });

  // Auto-load stored email and update credit count
  const storedEmail = localStorage.getItem("userEmail");
  if (storedEmail && emailInput) {
    emailInput.value = storedEmail;
    const res = await fetch(`/api/check-credits?email=${encodeURIComponent(storedEmail)}`);
    const data = await res.json();
    if (res.ok) {
      countMsg.textContent = `${data.credits} credits remaining.`;
    }
  }
});

// Form submission
document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("userEmail");
  const email = emailInput?.value?.trim().toLowerCase();

  if (!email) {
    alert("Please enter your email to continue.");
    emailInput?.focus();
    return;
  }

  localStorage.setItem("userEmail", email); // persist for refresh

  // Check if user has credits
  const check = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
  const data = await check.json();

  if (!check.ok || data.credits <= 0) {
    alert("You’ve used all your free/paid credits. Please purchase more to continue.");
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userInput)
    });

    const genData = await response.json();

    if (response.ok && genData.output) {
      resultBox.textContent = genData.output;

      // Consume a credit
      await fetch(`/api/use-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      // Update displayed credit count
      const refresh = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
      const newCredits = await refresh.json();
      const countMsg = document.getElementById("genCountMsg");
      if (countMsg) countMsg.textContent = `${newCredits.credits} credits remaining.`;
    } else {
      resultBox.textContent = genData.error || "Something went wrong generating your cover letter.";
    }
  } catch (error) {
    console.error("API call error:", error);
    resultBox.textContent = "Network error. Please try again later.";
  }
});