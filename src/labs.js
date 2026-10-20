
function getLabs() {
  return [
    {
      id: 'html',
      name: 'HTML Lab',
      description: 'Practice building web pages with HTML.',
      language: 'html'
    },
    {
      id: 'css',
      name: 'CSS Lab',
      description: 'Practice styling and responsive layouts.',
      language: 'css'
    },
    {
      id: 'javascript',
      name: 'JavaScript Lab',
      description: 'Practice programming for interactive websites.',
      language: 'javascript'
    },
    {
      id: 'python',
      name: 'Python Lab',
      description: 'Practice Python syntax and programming concepts.',
      language: 'python'
    }
  ];
}

module.exports = { getLabs };
