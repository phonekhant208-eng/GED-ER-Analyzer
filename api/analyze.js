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
- 2 Points: Clear thesis stating which position is better supported. Synthesizes evidence from BOTH passages. Critically evaluates the quality of the evidence (e.g., identifies flaws, strengths, gaps, or data source reliability). DOES NOT just summarize the texts.
- 1 Point: Simplistic thesis or standard summary. Pulls evidence from both sides but mostly describes what the authors said without deeply critiquing the validity, age, or quality of their statistics.
- 0 Points: No thesis or personal opinion only. Little/no textual evidence cited.


TRAIT 2: Development of Ideas and Organizational Structure (0 to 2 raw points -> 0 to 4 weighted points)
- 2 Points: Explicit paragraph structure (Intro, Body, Conclusion). Clear, logical progression with smooth transitions. Formal analytical tone.
- 1 Point: Weak organization, inconsistent flow, repetitive transitions, or drifts into personal anecdotes.
- 0 Points: NO paragraph breaks (written as a single block of text), disorganized, or too short.

TRAIT 3: Clarity and Command of Standard English Conventions (0 to 2 raw points -> 0 to 4 weighted points)
- 2 Points: Strong sentence variety, correct grammar, sound mechanics/punctuation/spelling. Errors rare.
- 1 Point: Frequent run-ons/fragments, noticeable mechanics errors, but meaning is clear.
- 0 Points: Severe, continuous breakdowns obstructing meaning.

CRITICAL RULES FOR GRADING:
1. Zero tolerance for personal anecdotes. If the essay uses phrases like "my cousin", "I think", or "in my opinion" instead of analyzing text statistics, Trait 1 MUST be 0 raw points.
2. If the text has significant lowercase "i" pronouns, lack of punctuation, or run-on sentences, Trait 3 MUST be 0 raw points.
3. To earn 2 raw points for Trait 1, the essay MUST explicitly evaluate advanced text elements, such as pointing out that Pendergast's survey is outdated (from 2012), questioning the background of the researchers, or directly analyzing specific logical fallacies. If the essay just contrasts the arguments and identifies basic bias/statistics without deep data scrutiny, it is a summary-analysis hybrid and MUST be capped at 1 raw point for Trait 1.


You MUST respond ONLY with a valid JSON object strictly adhering to this structure. Notice that the score is calculated AFTER the analysis:

{
  "trait1": { 
    "analysis": "Provide a 3-sentence deep evaluation of evidence synthesis here FIRST.",
    "raw": 0, 
    "weighted": 0 
  },
  "trait2": { 
    "analysis": "Assess paragraph usage, flow, and structural transitions here FIRST.",
    "raw": 0, 
    "weighted": 0 
  },
  "trait3": { 
    "analysis": "Highlight grammar, punctuation, or spelling patterns here FIRST.",
    "raw": 0, 
    "weighted": 0 
  },
  "totalRaw": 0,
  "totalWeighted": 0,
  "improvementPlan": [
    "Actionable fragment 1",
    "Actionable fragment 2",
    "Actionable fragment 3"
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
        model: 'openai/gpt-oss-120b',
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