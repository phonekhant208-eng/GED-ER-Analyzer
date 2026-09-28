const dropdown = document.getElementById("passage-select");
const preloadedView = document.getElementById("preloaded-view");
const customView = document.getElementById("custom-view");
const analyzeBtn = document.getElementById("analyze-btn");
const essayInput = document.getElementById("essay-input");

// Function to determine what the button text should say
function updateButtonText() {
  // Calculate word count by splitting by spaces and filtering out empty strings
  const text = essayInput.value.trim();
  const wordCount = text === "" ? 0 : text.split(/\s+/).length;

  if (dropdown.value === "custom") {
    analyzeBtn.innerText = " Grade My Extended Response";
  } else {
    // If it's a pre-loaded passage AND they wrote more than 100 words
    if (wordCount > 100) {
      analyzeBtn.innerText = " Check My Extended Response";
    } else {
      analyzeBtn.innerText = " Start Test";
    }
  }
}

// 1. Listen for Dropdown Changes
dropdown.addEventListener("change", (e) => {
  if (e.target.value === "custom") {
    preloadedView.classList.add("hidden");
    customView.classList.remove("hidden");
  } else {
    preloadedView.classList.remove("hidden");
    customView.classList.add("hidden");
  }
  // Run the button check in case they already pasted an essay before switching passages
  updateButtonText();
});

// 2. Listen for Typing/Pasting in the Text Area
essayInput.addEventListener("input", updateButtonText);
