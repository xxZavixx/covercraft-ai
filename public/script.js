document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();

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
    } else {
      resultBox.textContent = data.error || "Something went wrong generating your cover letter.";
    }
  } catch (error) {
    console.error("API call error:", error);
    resultBox.textContent = "Network error. Please try again later.";
  }
});
