document.addEventListener("DOMContentLoaded", async () => {
  const emailInput = document.getElementById("userEmail");
  const countMsg = document.getElementById("genCountMsg");

  // Unlock via redirect
  const params = new URLSearchParams(window.location.search);
  if (params.get("pro") === "1") {
    localStorage.setItem("allowManualUnlock", "true");
    alert("Thank you for upgrading to CoverCraft Pro!");
    history.replaceState({}, document.title, window.location.pathname);
  }

  // Manual unlock visibility
  const allowManualUnlock = localStorage.getItem("allowManualUnlock") === "true";
  const manualWrapper = document.getElementById("manualUnlockWrapper");
  if (manualWrapper && allowManualUnlock) {
    manualWrapper.style.display = "block";
  }

  // Manual unlock by email
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

  // Auto-fetch stored email + update credit count
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

// Generate Cover Letter
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

  // Step 1: Check credits
  const checkRes = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
  const creditData = await checkRes.json();

  if (!checkRes.ok || !creditData.credits || creditData.credits <= 0) {
    alert("You’ve used all your free or purchased credits. Please buy more.");
    document.getElementById("paypal-container-2S7SD3LJNS3VW")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  // Step 2: Submit form
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

      // Step 3: Consume a credit
      await fetch("/api/use-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      // Step 4: Refresh remaining credits
      const refreshRes = await fetch(`/api/check-credits?email=${encodeURIComponent(email)}`);
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && typeof refreshData.credits === "number") {
        const countMsg = document.getElementById("genCountMsg");
        if (countMsg) countMsg.textContent = `${refreshData.credits} credits remaining.`;
      }
    } else {
      resultBox.textContent = data.error || "Something went wrong generating your cover letter.";
    }
  } catch (error) {
    console.error("API call error:", error);
    resultBox.textContent = "Network error. Please try again later.";
  }
});