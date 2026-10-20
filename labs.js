const LABS = [
  {
    id: 'practice',
    title: 'Practice Lab',
    description: 'Practice a small coding task and save your solution in the browser.',
    language: 'JavaScript',
    prompt: 'Write a function that adds two numbers and returns the result.'
  },
  {
    id: 'debugging',
    title: 'Debugging Lab',
    description: 'Learn to inspect errors, isolate a cause, and test a fix.',
    language: 'JavaScript',
    prompt: 'Find and fix the error in: const total = 5; total = total + 1;'
  },
  {
    id: 'web-development',
    title: 'Web Development Lab',
    description: 'Build a simple page with HTML, CSS, and JavaScript.',
    language: 'HTML/CSS/JavaScript',
    prompt: 'Create a responsive card with a heading, description, and button.'
  }
];

function getLabs() {
  return LABS;
}

module.exports = { getLabs };
