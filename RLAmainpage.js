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

// 7. Listen for Essay Input
essayInput.addEventListener('input', updateButtonText);

// 8. Run initialization on page load
initPassageDropdown();