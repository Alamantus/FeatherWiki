# Feather Wiki

A lightweight quine for simple, self-contained wikis! The idea is that it's like [TiddlyWiki](https://tiddlywiki.com) but as small as possible.

Check out the [Documentation](https://alamantus.codeberg.page/FeatherWiki/) to see it in action and learn how to use it!

## Versions

As of version 1.2.0, there are now a few different versions of Feather Wiki with cute bird names depending on the kinds of functionality you're
looking for. Specifically, there are differences in _browser compatibility_ and _content editor_ for each version. Here is a breakdown of each
of the different versions available:

### Most Compatible

These versions will run on browsers running JavaScript with at least ECMAScript 2015 (also known as ES6) features.

- **Dove:** `81.222 kb`
  - Includes both What You See Is What You Get (WYSIWYG) editor _and_ Markdown editor with toggle button
- **Finch:** `78.130 kb`
  - Includes _only_ WYSIWYG editor. **When in doubt, choose this one!**
- **Chickadee:** `76.217 kb`
  - Includes _only_ Markdown editor.

### Least Compatible

These versions are smaller, but will only run on newer browsers running JavaScript with up to ECMAScript 2022 features.

- **Robin:** `80.112 kb`
  - Includes both WYSIWYG editor _and_ Markdown editor with toggle button
- **Sparrow:** `77.021 kb`
  - Includes _only_ WYSIWYG editor.
- **Hummingbird:** `75.152 kb`
  - Includes _only_ Markdown editor. The smallest it gets!

## Supported Browsers

🤖 Technical Talk 👨‍💻 Feather Wiki uses various JavaScript features that are as new as having been added to the ECMAScript specification
as recently as 2015. According to [this ECMAScript compatibility table](https://kangax.github.io/compat-table/es6/), the following
browser versions should definitely be able to run Feather Wiki without issues:

- Chrome 86+
- Edge 87+
- Firefox 88+
- iOS Safari 12+
- Opera 73+
- Opera Mobile 62+
- Safari 13+
- Samsung Internet for Android 12+

The chart linked above is incomplete, so if your browser is older than any of these, you _might_ still be able to run Feather Wiki, but
you'll have to check yourself if it supports features from ECMAScript 2015 (also known as ES6). 💻

## Contribution

**For the coders:** Feel free to fork this repo and submit pull requests to have your changes or additions reviewed! I might ask for changes
to make the output smaller or improve organization, but I also reserve the right to deny changes outright in favor of a future plugin/code
extension system that allows users to inject their own code into their Feather Wiki instead of including it in the base.

**For anyone:** If you have a request to either add to or improve Feather Wiki or your have encountered a problem not related to browser
compatibility, I encourage you to first browse the [current issues](https://codeberg.org/Alamantus/FeatherWiki/issues) and create a new issue
with the details _only if_ one regarding your topic doesn't already exist, and I will try to reply promptly and add an appropriate label. As
above, I reserve the right to deny requests, but if a given request garners enough interest, I'll be much more likely to consider it!
