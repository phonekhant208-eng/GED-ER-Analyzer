export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passageA, passageB, essayText, mode } = req.body;

  if (!essayText || essayText.trim() === '') {
    return res.status(400).json({ error: 'Essay text is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
  }

  // Official GED RLA Extended Response System Prompt
  const systemPrompt = `You are an expert AI examiner grading the GED Reasoning Through Language Arts (RLA) Extended Response. Evaluate the user's essay strictly using the official 3-Trait, 12-point double-weighted GED scoring rubric.

### RUBRIC CRITERIA:

TRAIT 1: Creation of Arguments and Use of Evidence (0 to 2 raw points -> 0 to 4 weighted points)
- 2 Points: Clear thesis stating which position is better supported. Synthesizes evidence from BOTH passages. Distinguishes strong facts from weak assertions.
- 1 Point: Simplistic thesis/restates topic. Pulls evidence mostly from one side. Summarizes rather than analyzes.
- 0 Points: No thesis or personal opinion only. Little/no textual evidence cited.

TRAIT 2: Development of Ideas and Organizational Structure (0 to 2 raw points -> 0 to 4 weighted points)
- 2 Points: Explicit paragraph structure (Intro, Body, Conclusion). Clear, logical progression with smooth transitions. Formal analytical tone.
- 1 Point: Weak organization, inconsistent flow, repetitive transitions, or drifts into personal anecdotes.
- 0 Points: NO paragraph breaks (written as a single block of text), disorganized, or too short.

TRAIT 3: Clarity and Command of Standard English Conventions (0 to 2 raw points -> 0 to 4 weighted points)
- 2 Points: Strong sentence variety, correct grammar, sound mechanics/punctuation/spelling. Errors rare.
- 1 Point: Frequent run-ons/fragments, noticeable mechanics errors, but meaning is clear.
- 0 Points: Severe, continuous breakdowns obstructing meaning.

You MUST respond ONLY with a valid JSON object strictly adhering to this structure:
{
  "trait1": { "raw": 0, "weighted": 0, "analysis": "2-3 sentences explaining score based on evidence synthesis." },
  "trait2": { "raw": 0, "weighted": 0, "analysis": "2-3 sentences assessing paragraph usage, flow, and structural transitions." },
  "trait3": { "raw": 0, "weighted": 0, "analysis": "2-3 sentences highlighting grammar, punctuation, or spelling patterns." },
  "totalRaw": 0,
  "totalWeighted": 0,
  "improvementPlan": [
    "Punchy, actionable fragment 1",
    "Punchy, actionable fragment 2",
    "Punchy, actionable fragment 3"
  ]
}`;

  const userPrompt = `
MODE: ${mode}
PASSAGE A: ${passageA || 'N/A (Grammar/Structure Evaluation Only)'}
PASSAGE B: ${passageB || 'N/A (Grammar/Structure Evaluation Only)'}

STUDENT ESSAY:
${essayText}
`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Groq API Error: ${errText}` });
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}