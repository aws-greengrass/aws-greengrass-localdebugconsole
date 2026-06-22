// Commitlint configuration.
//
// Extends the conventional-commit preset (the default used by
// wagoid/commitlint-github-action when no config is present), but disables the
// body line-length limit. Dependabot generates commit bodies that contain long
// URLs (release-notes and compare links) which exceed the default 100-character
// limit and would otherwise fail CI on every dependency-bump PR.
// All other conventional-commit rules (type, scope, subject, etc.) remain
// enforced for human-authored commits.
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'body-max-line-length': [0, 'always', 100],
    },
};
