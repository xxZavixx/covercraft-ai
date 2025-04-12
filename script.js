document.getElementById("coverForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const userInput = Object.fromEntries(formData.entries());

  document.getElementById("resultBox").textContent = "Generating cover letter...";

  // Call your secure API route here (we'll build this next)
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userInput)
  });

  const data = await res.json();
  document.getElementById("resultBox").textContent = data.output || "Something went wrong.";
});
