// 1. Initialize Supabase Client
const SUPABASE_URL = "https://mibyte.site";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5enN5bWVkZWttZWtnb3N5a2lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNTM3MTksImV4cCI6MjA5OTkyOTcxOX0.H7cgkvW2gCIX2DiNePoU8hImQI8k6Fo2NK148uC5pPU";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM Element Selectors
const dropdown = document.getElementById('passage-select');
const preloadedView = document.getElementById('preloaded-view');
const customView = document.getElementById('custom-view');
const analyzeBtn = document.getElementById('analyze-btn');
const essayInput = document.getElementById('essay-input');

// Cache object storing fetched passages
const passageCache = {};

// 3. Populate Dropdown dynamically from Supabase
async function initPassageDropdown() {
    const { data, error } = await supabaseClient
        .from('RLA_ER_Source_Text')
        .select('title, slug, passage_a_title, passage_a_text, passage_b_title, passage_b_text');

    if (error) {
        console.error('Error loading passage list:', error);
        return;
    }

    // Loop through every record in the table
    data.forEach(item => {
        // Prime the cache so switching is instantaneous
        passageCache[item.slug] = item;

        // Create and append a new <option> for each database record
        const option = document.createElement('option');
        option.value = item.slug;
        option.textContent = item.title || `Passage: ${item.slug}`;
        dropdown.appendChild(option);
    });
}

// 4. Update Button Label based on Word Count and Mode
function updateButtonText() {
    const text = essayInput.value.trim();
    const wordCount = text === "" ? 0 : text.split(/\s+/).length;

    if (dropdown.value === 'custom') {
        analyzeBtn.innerText = ' Grade My Extended Response';
    } else {
        if (wordCount > 100) {
            analyzeBtn.innerText = ' Check My Extended Response';
        } else {
            analyzeBtn.innerText = ' Start Test';
        }
    }
}

// 5. Render Selected Passage into Left Panel
function renderPreloadedPassage(data) {
    preloadedView.innerHTML = `
        <div class="passage-box">
            <h3>${data.passage_a_title || 'Passage A'}</h3>
            <p>${data.passage_a_text}</p>
        </div>
        <div class="passage-box">
            <h3>${data.passage_b_title || 'Passage B'}</h3>
            <p>${data.passage_b_text}</p>
        </div>
    `;
}

// 6. Listen for Dropdown Changes
dropdown.addEventListener('change', (e) => {
    const selectedSlug = e.target.value;

    if (selectedSlug === 'custom') {
        preloadedView.classList.add('hidden');
        customView.classList.remove('hidden');
    } else {
        customView.classList.add('hidden');
        preloadedView.classList.remove('hidden');

        // Display passage from cache
        if (passageCache[selectedSlug]) {
            renderPreloadedPassage(passageCache[selectedSlug]);
        }
    }

    updateButtonText(); 
});

// 7. Send Essay to Groq Serverless Endpoint (/api/analyze)
async function analyzeEssay() {
    const essayText = essayInput.value.trim();
    if (!essayText) {
        alert("Please enter your essay before grading.");
        return;
    }

    const selectedMode = dropdown.value;
    let passageA = "";
    let passageB = "";

    if (selectedMode === 'custom') {
        const textareas = customView.querySelectorAll('textarea');
        passageA = textareas[0]?.value || "";
        passageB = textareas[1]?.value || "";
    } else if (passageCache[selectedMode]) {
        passageA = passageCache[selectedMode].passage_a_text;
        passageB = passageCache[selectedMode].passage_b_text;
    }

    // Set Loading UI State
    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "⏳ Grading with Official GED Rubric...";

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: selectedMode,
                passageA: passageA,
                passageB: passageB,
                essayText: essayText
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to analyze essay');
        }

        renderResults(data);
    } catch (err) {
        console.error(err);
        alert(`Analysis Error: ${err.message}`);
    } finally {
        analyzeBtn.disabled = false;
        updateButtonText();
    }
}

// 8. Render Scorecard inside Right Panel matching the 12-point rubric
function renderResults(data) {
    const resultsView = document.getElementById('results-view'); // Ensure we select it
    resultsView.classList.remove('hidden');
    
    resultsView.innerHTML = `
        <h2 style="color: var(--rla-theme); margin-bottom: 1rem;">📊 Official GED Score Summary</h2>
        <div style="font-size: 1.4rem; font-weight: 800; margin-bottom: 1.5rem; background: #f0ebf2; padding: 1rem; border-radius: 8px; text-align: center;">
            Total Cumulative Score: ${data.totalWeighted} / 12 Points (Raw: ${data.totalRaw}/6)
        </div>

        <h3 style="margin-bottom: 0.5rem;">Detailed Trait Breakdown</h3>
        <ul style="margin: 0.5rem 0 1.5rem 0; padding-left: 1.2rem; line-height: 1.5;">
            <li><strong>Trait 1 (Argument & Evidence):</strong> Raw ${data.trait1?.raw}/2 | Weighted ${data.trait1?.weighted}/4<br><span style="color: #555; font-size: 0.92rem;">${data.trait1?.analysis || ''}</span></li>
            <li style="margin-top: 0.8rem;"><strong>Trait 2 (Organization & Structure):</strong> Raw ${data.trait2?.raw}/2 | Weighted ${data.trait2?.weighted}/4<br><span style="color: #555; font-size: 0.92rem;">${data.trait2?.analysis || ''}</span></li>
            <li style="margin-top: 0.8rem;"><strong>Trait 3 (Language & Conventions):</strong> Raw ${data.trait3?.raw}/2 | Weighted ${data.trait3?.weighted}/4<br><span style="color: #555; font-size: 0.92rem;">${data.trait3?.analysis || ''}</span></li>
        </ul>

        <h3 style="margin-top: 1.5rem;">Bulleted Improvement Plan</h3>
        <ul style="padding-left: 1.2rem; color: #c62828; line-height: 1.4;">
            ${(data.improvementPlan || []).map(tip => `<li style="margin-bottom: 0.4rem;">${tip}</li>`).join('')}
        </ul>
        
        <button id="reset-btn" class="btn-primary" style="margin-top: 2rem; background-color: #718096; width: 100%;">✏️ Edit Essay & Try Again</button>
    `;

    document.getElementById('reset-btn').addEventListener('click', () => {
        resultsView.classList.add('hidden');
    });
}

// 9. Attach Click Listener to Grade Button (THIS IS WHAT TRIGGERS EVERYTHING)
analyzeBtn.addEventListener('click', analyzeEssay);


// 7. Listen for Essay Input
essayInput.addEventListener('input', updateButtonText);

// 8. Run initialization on page load
initPassageDropdown();