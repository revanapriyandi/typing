# Contributing to TypeRush

First off, thank you for considering contributing to TypeRush! It's people like you that make TypeRush a great tool for everyone.

## Where do I go from here?

If you've noticed a bug or have a feature request, please open an issue! It’s best if you check to make sure the same issue hasn't been submitted by someone else first.

### Fork & create a branch

If this is something you think you can fix, then fork TypeRush and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-french-translations
```

### Implementing testing

We currently test everything locally before pushing to production. Make sure to:

- Run a successful local build (`npm run build`) before submitting your code.
- Check that there are no TypeScript linting errors.
- Ensure any user-facing UI follows the localization pattern by utilizing `next-intl` rather than hardcoded English strings.

### Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with TypeRush's master branch:

```sh
git remote add upstream git@github.com:your-username/typerush.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```sh
git checkout 325-add-french-translations
git rebase master
git push --set-upstream origin 325-add-french-translations
```

Finally, go to GitHub and make a Pull Request! We'll review your code as soon as possible.

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Coding conventions

- We use TypeScript. Avoid `any` types whenever possible.
- We use `shadcn/ui` components for most basic blocks (Buttons, Inputs, Dialogs). Please try not to introduce redundant custom UI variations unless absolutely necessary.
- Keep styling inside standard Tailwind CSS utility classes.

Thank you for contributing!
