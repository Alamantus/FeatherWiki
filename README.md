# Feather Wiki

A lightweight [quine](https://en.wikipedia.org/wiki/Quine_(computing)) for simple, self-contained wikis! The idea is that it's like
[TiddlyWiki](https://tiddlywiki.com) but as small as possible.

Check out the [Documentation](https://feather.wiki) to see it in action and learn how to use it!

## Versions

As of version 1.2.0, there are now a few different versions of Feather Wiki depending on the kinds of functionality you're looking for, each
with its own cute bird name to indicate its size _(and to maybe help make up for the fact that there are 6 versions as a result 😵)_.
Specifically, there are differences in _content editor_ and _server compatibility_ for each version. Below is a breakdown of each
version.

### Simple

In _most_ cases, this is the section you want to choose from. These versions will run on browsers running JavaScript with at least
[ECMAScript 2015](https://caniuse.com/es6) (also known as ES6) features.

- **Dove:** `66.141 KB`
  - Includes both What You See Is What You Get (WYSIWYG) editor _and_ Markdown editor with toggle button
- **Finch:** `61.960 KB`
  - Includes _only_ WYSIWYG editor. **When in doubt, choose this one!**
- **Chickadee:** `61.071 KB`
  - Includes _only_ Markdown editor.

<details>
<summary>👨‍💻 Technical Talk: Supported Browsers</summary>

According to [this ECMAScript compatibility table](https://kangax.github.io/compat-table/es6/), the following
browser versions should definitely be able to run Feather Wiki version 1.3.0 and up without issues:

- Chrome 86+
- Edge 87+
- Firefox 88+
- iOS Safari 12+
- Opera 73+
- Opera Mobile 62+
- Safari 13+
- Samsung Internet for Android 12+

The chart linked above is incomplete, so if your browser is older than any of these, you _might_ still be able to run Feather Wiki, but
you'll have to check yourself if it supports [features from ECMAScript 2015](https://caniuse.com/es6) (also known as ES6).

</details>

<!--
### Least Compatible

These versions are smaller, but will only run on newer browsers running JavaScript with up to [ECMAScript 2020 features](https://caniuse.com/es6,array-includes,async-functions,pad-start-end,mdn-javascript_operators_optional_chaining,mdn-javascript_operators_nullish_coalescing). As such, these
are much more symbolic than actually recommended for use; _Only use these if you use a modern, up-to-date web browser and don't plan on
publishing your Feather Wiki for other to see._

- **Robin:** `62.130 KB`
  - Includes both WYSIWYG editor _and_ Markdown editor with toggle button
- **Sparrow:** `58.370 KB`
  - Includes _only_ WYSIWYG editor.
- **Hummingbird:** `56.946 KB`
  - Includes _only_ Markdown editor. The smallest it gets!
-->

### Server-Saving

These versions are the same as those in the section above, but they are larger because they include extra code for saving to certain web servers.
Currently the only viable use for these versions is through [Tiddlyhost](https://tiddlyhost.com), but a simple Feather Wiki server is planned
in the near future! See [scripts/test-build.js](https://codeberg.org/Alamantus/FeatherWiki/src/branch/main/scripts/test-build.js) for an overly-simple
example of how to implement the PUT-save feature—if you work on an implementation for this on your own, make sure you add password protection!

These versions are specifically named after migratory birds of different sizes to reflect their travel to the server from your browser!

- **Tern:** `67.115 KB`
  - Includes both WYSIWYG editor _and_ Markdown editor with toggle button
- **Swallow:** `62.944 KB`
  - Includes _only_ WYSIWYG editor.
- **Bluethroat:** `62.050 KB`
  - Includes _only_ Markdown editor.

## Contribution

### For anyone

If you have a request to either add to or improve Feather Wiki or your have encountered a problem not related to browser
compatibility, I encourage you to first browse the [current issues](https://codeberg.org/Alamantus/FeatherWiki/issues) and create a new issue
with the details _only if_ one regarding your topic doesn't already exist, and I will try to reply promptly and add an appropriate label.
I reserve the right to deny requests, but if a given request garners enough interest, I'll be much more likely to consider it!

The observant among you may have noticed that there is a [mirror on GitHub](https://github.com/Alamantus/FeatherWiki) (if that's where you're reading this, hello to you!). I will review Issue tickets from the GitHub mirror, but I request that you submit make an attempt to submit them to the [Codeberg repository](https://codeberg.org/Alamantus/FeatherWiki)
if at all possible. I will not be monitoring the GitHub repo closely, though I should receive email notifications.

### For coders

Feel free to fork this repo and submit pull requests to have your changes or additions reviewed! I might ask for changes
to make the output smaller or improve organization, but as above, I also reserve the right to deny changes outright in favor of a future plugin/code
extension system that allows users to inject their own code into their Feather Wiki instead of including it in the base.  
The observant among you may have noticed that there is a [mirror on GitHub](https://github.com/Alamantus/FeatherWiki) (if that's where you're reading this, hello to you!). I will review pull requests from the GitHub mirror, but I request that you submit make an attempt to submit your pull requests to the
[Codeberg repository](https://codeberg.org/Alamantus/FeatherWiki) if at all possible. I will not be monitoring the GitHub repo closely, though I should receive email notifications.

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

To test a build, you can use `npm test` to build all versions and serve Tern on a local server. You can choose a specific
build version to test by specifying the build name like `npm test -- Swallow`. The test script will allow server-focused
versions of Feather Wiki to use the "Save Wiki to Server" button—the output gets saved to `develop/put-save.html` if you need
to check it.

### Details

Feather Wiki uses [Choo](https://choo.io) as its base JavaScript framework, a subset of [JSON-Compress](https://github.com/Alamantus/JSON-Compress) for
minifying JSON output, [pell](https://jaredreich.com/pell/) for its HTML editor, and [Snarkdown](https://github.com/developit/snarkdown) for
its Markdown parsing.

If you want to restrict a feature to one build or another (which I request you do if it's only specific to one editor or another),
use `process.env.EDITOR === 'md'` in an `if` statement to ensure that esbuild removes the code on build for the irrelevant versions.

The overarching goal is to keep Feather Wiki as small as possible while still providing the most important features. Unfortunately, that's
a pretty loose and fluid goal, but as long as you keep "as small as possible" in mind, you probably won't go too far astray.

## License Clarification

Feather Wiki is an HTML document containing a self-replicating JavaScript application for creating wiki-style websites whose content is also stored in the output.  
Copyright (C) 2022 [Robbie Antenesse](https://robbie.antenesse.net) \<dev@alamantus.com\>

Feather Wiki is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

Any content created by a user using any version of Feather Wiki is
the property of its creator. User-created data and the replicated
copies of Feather Wiki containing user-created data can be used and
distributed however their creator see fit. The GNU Affero General
Public License applies to the code that constitutes the Feather Wiki
application and NOT the content created by users of Feather Wiki
unless explicitly stated by the user within their own content.

Feather Wiki is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

A [copy of the GNU Affero General Public License](https://codeberg.org/Alamantus/FeatherWiki/src/branch/main/LICENSE)
is included in the source code of Feather Wiki. If not, see
https://www.gnu.org/licenses/.
