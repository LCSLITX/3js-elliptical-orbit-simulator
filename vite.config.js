/**
 * @type {import('vite').UserConfig}
 */
export default {
  // This is necessary in order to work with the GitHub Pages deployment.
  // If `base` is not configured properly then the necessary files won't be found by GH-Pages.
  // Change the <REPOSITORY_NAME> as the example shows.
  // base: process.env.NODE_ENV === 'production' ? '/<REPOSITORY_NAME>/' : ''
  base: process.env.NODE_ENV === 'production' ? '/3js-elliptical-orbit-simulator/' : '',
}