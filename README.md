# Feather Wiki

A lightweight [quine](https://en.wikipedia.org/wiki/Quine_(computing)) for simple, self-contained wikis! The idea is that it's like
[TiddlyWiki](https://tiddlywiki.com) but as small as possible.

Check out the [Documentation](https://feather.wiki) to see it in action and learn how to use it!

## Versions

As of version 1.2.0, there are now a few different versions of Feather Wiki depending on the kinds of functionality you're looking for, each
with its own cute bird name to indicate its size _(and to maybe help make up for the fact that there are 6 versions as a result 😵)_.
Specifically, there are differences in _browser compatibility_ and _content editor_ for each version. Below is a breakdown of each
version.

### Most Compatible

In _most_ cases, this is the section you want to choose from. These versions will run on browsers running JavaScript with at least
ECMAScript 2015 (also known as ES6) features.

- **Dove:** `82.325 kb`
  - Includes both What You See Is What You Get (WYSIWYG) editor _and_ Markdown editor with toggle button
- **Finch:** `79.069 kb`
  - Includes _only_ WYSIWYG editor. **When in doubt, choose this one!**
- **Chickadee:** `77.138 kb`
  - Includes _only_ Markdown editor.

<details>
<summary>👨‍💻 Technical Talk: Supported Browsers</summary>

According to [this ECMAScript compatibility table](https://kangax.github.io/compat-table/es6/), the following
browser versions should definitely be able to run the Dove, Finch, and Chickadee versions of Feather Wiki without issues:

- Chrome 86+
- Edge 87+
- Firefox 88+
- iOS Safari 12+
- Opera 73+
- Opera Mobile 62+
- Safari 13+
- Samsung Internet for Android 12+

The chart linked above is incomplete, so if your browser is older than any of these, you _might_ still be able to run Feather Wiki, but
you'll have to check yourself if it supports features from ECMAScript 2015 (also known as ES6).

</details>

### Least Compatible

These versions are smaller, but will only run on newer browsers running JavaScript with up to ECMAScript 2020 features. As such, these
are much more symbolic than actually recommended for use; _Only use these if you use a modern, up-to-date web browser and don't plan on
publishing your Feather Wiki for other to see._

- **Robin:** `80.966 kb`
  - Includes both WYSIWYG editor _and_ Markdown editor with toggle button
- **Sparrow:** `77.711 kb`
  - Includes _only_ WYSIWYG editor.
- **Hummingbird:** `75.824 kb`
  - Includes _only_ Markdown editor. The smallest it gets!

## Contribution

**For anyone:** If you have a request to either add to or improve Feather Wiki or your have encountered a problem not related to browser
compatibility, I encourage you to first browse the [current issues](https://codeberg.org/Alamantus/FeatherWiki/issues) and create a new issue
with the details _only if_ one regarding your topic doesn't already exist, and I will try to reply promptly and add an appropriate label. As
above, I reserve the right to deny requests, but if a given request garners enough interest, I'll be much more likely to consider it!

**For the coders:** Feel free to fork this repo and submit pull requests to have your changes or additions reviewed! I might ask for changes
to make the output smaller or improve organization, but I also reserve the right to deny changes outright in favor of a future plugin/code
extension system that allows users to inject their own code into their Feather Wiki instead of including it in the base.

## Development

Feather Wiki uses only a few JavaScript libraries to function on the front end, but it requires more to develop.

To get your computer set up to develop:

1. Install [Git](https://git-scm.com)
1. Install [Node](https://nodejs.org)
1. Use a command line or terminal
1. Clone the git repo with `git clone https://codeberg.org/Alamantus/FeatherWiki.git`
1. Navigate to your cloned repo `cd FeatherWiki`
1. Run `npm install`
1. Run `npm start` and visit http://localhost:3000 in your browser
1. Start making changes to the JavaScript to update your build—you will need to refresh your browser to see your changes
  - Note: Changing the CSS doesn't automatically update the build, so you'll need to modify some JS or restart the script to see those changes

When you're ready to build, simply use the `npm run build:all` to build all versions of Feather Wiki at once!

If you only want to make changes to one version of an editor, you can use

- `npm run build:both` to build the Dove & Robin versions
- `npm run build:html` to build the Finch & Sparrow versions
- `npm run build:md` to build the Chickadee & Hummingbird versions

### Details

Feather Wiki uses [Choo](https://choo.io) as its base JavaScript framework, [JSON-Compress](https://github.com/Alamantus/JSON-Compress) for
minifying JSON output, [pell](https://jaredreich.com/pell/) for its HTML editor, and [Snarkdown](https://github.com/developit/snarkdown) for
its Markdown parsing.

If you want to restrict a feature to one build or another (which I request you do if it's only specific to one editor or another),
use `process.env.EDITOR === 'md'` in an `if` statement to ensure that esbuild removes the code on build for the irrelevant versions.

The overarching goal is to keep Feather Wiki as small as possible while still providing the most important features. Unfortunately, that's
a pretty loose and fluid goal, but as long as you keep "as small as possible" in mind, you probably won't go too far astray.
