# Feather Wiki

A 55.660 kilobyte [quine](https://en.wikipedia.org/wiki/Quine_(computing)) for creating simple, self-contained wikis. The idea is that it's like [TiddlyWiki](https://tiddlywiki.com) but as small as possible.

Check out the [Documentation](https://feather.wiki) to see it in action and learn how to use it!

## Browser Compatibility

Feather Wiki will only run on browsers that support [ECMAScript 2015](https://caniuse.com/es6) (also known as ES6) features.

<details>
<summary>👨‍💻 Technical Talk: Supported Browsers</summary>

According to [this ECMAScript compatibility table](https://compat-table.github.io/compat-table/es6/), the following browser versions should definitely be able to run Feather Wiki version 1.3.0 and up without issues:

- Chrome 86+
- Edge 87+
- Firefox 88+
- iOS Safari 12+
- Opera 73+
- Opera Mobile 62+
- Safari 13+
- Samsung Internet for Android 12+

The chart linked above is incomplete, so if your browser is older than any of these, you _might_ still be able to run Feather Wiki, but you'll have to check yourself if it supports [features from ECMAScript 2015](https://caniuse.com/es6).

</details>

### Server-Saving

Feather Wiki includes code for saving directly to web servers that are set up in a particular way. It expects a `dav` header with any value to be returned by an `OPTIONS` call to the server at the same address as the Feather Wiki file is served. If the server looks compatible, Feather Wiki will display a "Save Wiki to Server" button above a "Save Wiki Locally" button.

When the user clicks the "Save Wiki to Server" button, Feather Wiki will send a `PUT` request to the server with a body that contains the full HTML output of the Feather Wiki file that would normally be downloaded to the computer. If you want password protection on your wiki (and I think you _should_), then you'll need to implement that in a way that the server can understand, whether by having the user log in on a different page and saving to a domain cookie or by using basic HTTP auth—the choice is yours.

After sending to the server, Feather Wiki expects either a success or failed response with an optional text message as the body to explain a failure. If no text is returned in the response body on a failure, it will simply display the status code in a message box, eg. "Save Failed! Status 403." On success, Feather Wiki will display "Saved." Otherwise the message that was sent from the server will be displayed.

You can see this functionality on [Tiddlyhost](https://tiddlyhost.com) or by using a [self-hosted nest](./nests) from this repository!

## Bones, Muscles, & Plumage

As of version 1.9.0, it is possible to download a "bare" Feather Wiki HTML file (Bones) that loads Feather Wiki's raw CSS (Plumage) and JavaScript (Muscles) files instead of including them in the HTML itself. This is mainly useful when you want to serve multiple Feather Wikis on a server but have them use the same CSS and JavaScript.

When the Muscles file is loaded from the Bones file, the "Save Wiki" button changes its behavior to save your Feather Wiki's content to an HTML file that expects Muscles and Plumage to be loaded separately—like the Bones HTML file. So when you open the saved HTML file, you will need the Muscles and Plumage files to be available in the same directory as well.

By altering the Feather Wiki Bones and providing a custom save function, you can effectively change how the data is stored. Just note that the Bones file will require the Feather Wiki data to be injected into the `<script id="p" type="application/json">` block so the Muscles will load it correctly. By injecting the JSON in the correct format from the server side, you can keep your stored files small and store the Feather Wiki data separately.

## Contribution

See the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how you can help with the project. Details on adding non-English translations to Feather Wiki are included there.

If you want to support the developer monetarily, you can send one-time donations via <https://buymeacoffee.com/robbieantenesse> or <https://ko-fi.com/robbieantenesse>, or you can use <https://liberapay.com/robbieantenesse> to set up recurring donations. This is absolutely not required, but it's greatly appreciated!

## Development

Feather Wiki only has NPM dependencies for development and building the project.

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

### Testing

The test suite is a custom-built script that runs the files in `scripts/tests/` using [Selenium WebDriver](https://www.selenium.dev/documentation/webdriver/). Tests run Firefox as an automated instance—installing Firefox may be required in order to run tests, I haven't tested what happens without it. While running tests, don't interact with the browser window—it may take a couple minutes if you run the whole test suite.

To test a build, you can use `npm test` to run a suite of tests that are defined in `scripts/tests/` to check a number of different scenarios. Please make sure any changes you make don't cause tests to fail without either adjusting the tests or fixing your code. You can pass the function names of specific tests to run (one or more) to help with writing them: `npm test -- canUpdateTitleAndDescription` or separate with a space `npm test -- canUpdateTitleAndDescription confirmDefaultEditorIsEd` for multiple.

### Building

When you're ready to build, simply use the `npm run build` to build all translations of Feather Wiki, including the Bones, Muscle, and Plumage files. The result will be put into the `builds/` folder under a subdirectory with the minor version, i.e. `builds/v1.9.x`.

### Details

Feather Wiki uses a modified version of [Choo](https://choo.io) as its [base JavaScript framework](./featherchoo.js), a subset of [JSON-Compress](https://github.com/Alamantus/JSON-Compress) for minifying JSON output, a customized [pell](https://jaredreich.com/pell/) for its [Visual editor](./helpers/ed.js), and a greatly customized [md.js](https://github.com/thysultan/md.js) for its [Markdown parsing](./helpers/md.js).

The overarching goal is to keep Feather Wiki as small as possible while still providing the most important features. Unfortunately, that's a pretty loose and fluid goal, but as long as you keep "as small as possible" in mind, you probably won't go too far astray.

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
