/**
 * Entry point for the Probot app.
 *
 * @param {import('probot').Probot} app - The Probot instance.
 */
const OpenAI = require('openai');
const openai = new OpenAI();

/**
 * Handles pull request review comments and generates explanations using OpenAI.
 *
 * @param {import('probot').Context} context - The Probot context.
 */
async function handleReviewComment(context) {
  const { payload } = context;
  const { pull_request, comment } = payload;
  const { id, original_start_line, original_line, diff_hunk, body } = comment;
  const { head } = pull_request;

  const owner = head.repo.owner.login;
  const repo = head.repo.name;
  const pull_number = pull_request.number;
  const comment_id = id;

  if (body.includes('/explain')) {
    const code = diff_hunk.split('\n').slice(original_start_line, original_line + 1).join('\n');
    const openai_response = await generateExplanation(code);
    await context.octokit.pulls.createReplyForReviewComment({
      owner,
      repo,
      pull_number,
      comment_id,
      body: openai_response,
    });
  } else {
    console.log('No command found for execution');
  }
}

/**
 * Generates an explanation for a given code snippet using OpenAI.
 *
 * @param {string} code - The code snippet to explain.
 * @returns {Promise<string>} - The generated explanation.
 */
async function generateExplanation(code) {
  const prompt = `Provide a short overview of this code: ${code}. Limit the response to 150 words.`;
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: prompt }],
    model: 'gpt-3.5-turbo',
  });

  return completion.choices[0].message.content;
}

/**
 * Main export for the Probot app.
 *
 * @param {import('probot').Probot} app - The Probot instance.
 */
module.exports = (app) => {
  app.log.info('Yay, the app was loaded!');
  app.on('pull_request_review_comment', handleReviewComment);
};
