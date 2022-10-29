# Feather Wiki

A 54.435 kilobyte [quine](https://en.wikipedia.org/wiki/Quine_(computing)) for simple, self-contained wikis! The idea is that it's like
[TiddlyWiki](https://tiddlywiki.com) but as small as possible.

Check out the [Documentation](https://feather.wiki) to see it in action and learn how to use it!

## Versions

Feather Wiki has two primary builds depending on your needs, Wren for everyday use and Warbler for web servers to trigger a save if set up correctly. The vast majority of people will likely only use Wren—if you don't plan on setting up a web server that can support saving the HTML file over the existing file directly on the server, then you're the majority of people.

Both of these builds have an alternative "ruffled" option that uses less minification to allow for better compatibility with certain web browsers at the cost of a couple of extra kilobytes in size. If you're not able to get Feather Wiki running in your browser of choice, give the ruffled option a try. All builds can be found on the [website](https://feather.wiki/?page=downloads) or on the repository's [Releases page](https://codeberg.org/Alamantus/FeatherWiki/releases).

Feather Wiki will only run on browsers that support [ECMAScript 2015](https://caniuse.com/es6) (also known as ES6) features.

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

### Server-Saving

Warbler is the server build of Feather Wiki, and it is exactly the same as Wren except that it is larger (55.420 kilobytes) because it includes extra code for saving to certain web servers.

Currently the only viable use for this version is through [Tiddlyhost](https://tiddlyhost.com) or by using [Caddy 2](https://caddyserver.com/download?package=github.com%2Fmholt%2Fcaddy-webdav) with the WebDAV extension and the [Caddyfile.example](https://codeberg.org/Alamantus/FeatherWiki/src/branch/main/Caddyfile.example) in this repository, but more script collections for other servers are being worked on to create your own nests! See [scripts/test-build.js](https://codeberg.org/Alamantus/FeatherWiki/src/branch/main/scripts/test-build.js) for an overly-simple
example of how to implement the PUT-save feature—if you work on an implementation for this on your own, make sure you add password protection!

#### Server Setup

Warbler expects a `dav` header with any value to be returned by an `OPTIONS` call to the server at the same address as the Feather Wiki file is served. If the server looks compatible, Feather Wiki will display a new "Save Wiki to Server" button above a "Save Wiki Locally" button.

When the user clicks the "Save Wiki to Server" button, Feather Wiki will send a `PUT` request to the server with a body that contains the full HTML output of the Feather Wiki file that would normally be downloaded to the computer. If you want password protection on your wiki (and I think you _should_), then you'll need to implement that in a way that the server can understand, whether by having the user log in on a different page and saving to a domain cookie or by using basic HTTP auth—the choice is yours.

After sending to the server, Feather Wiki expects either a success or failed response with an optional text message as the body to explain a failure. If not text is returned in the response body on a failure, it will simply display the status code in a message box, eg. "Save Failed! Status 403." On success, Feather Wiki will display "Saved."

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

When you're ready to build, simply use the `npm run build` to build all versions of Feather Wiki at once!

To test a build, you can use `npm test` to build all versions and serve the Server build on a local server. The test script will allow
Feather Wiki to use the "Save Wiki to Server" button—the output gets saved to `develop/put-save.html` if you need
to check it.

### Details

Feather Wiki uses a modified version of [Choo](https://choo.io) as its base JavaScript framework, a subset of [JSON-Compress](https://github.com/Alamantus/JSON-Compress) for
minifying JSON output, a customized [pell](https://jaredreich.com/pell/) for its HTML editor, and a customized [md.js](https://github.com/thysultan/md.js) for
its Markdown parsing.

If you want to restrict a feature to one build or another (which I request you do if it's only specific to the regular or server build),
use `process.env.SERVER` in an `if` statement to ensure that esbuild removes the code on build for the irrelevant versions. It will be auto-populated with `true` or `false` during the build process.

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
