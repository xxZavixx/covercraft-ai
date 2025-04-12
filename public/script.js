document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const isPro = localStorage.getItem("isProUser") === "true";
  let tries = parseInt(localStorage.getItem("coverTries") || "0");

  if (!isPro && tries >= 2) {
    alert("You've reached your free limit. Please upgrade to CoverCraft Pro.");
    document.getElementById("paypal-container-2S7SD3LJNS3VW").scrollIntoView({ behavior: "smooth" });
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