# How to Contribute to Feather Wiki

I appreciate however you can help with this project! There are many ways you can help, whether you're able to write code or not.

## For anyone

If you have a request to either add to or improve Feather Wiki or you have encountered a problem not related to browser
compatibility, I encourage you to first browse the [current issues](https://codeberg.org/Alamantus/FeatherWiki/issues) and create a new issue
with the details _only if_ one regarding your topic doesn't already exist, and I will try to reply promptly and add an appropriate label.
I reserve the right to deny requests, but if a given request garners enough interest, I'll be much more likely to consider it!

The observant among you may have noticed that there is a [mirror on GitHub](https://github.com/Alamantus/FeatherWiki) (if that's where you're reading this, hello to you!). I will review Issue tickets from the GitHub mirror, but I request that you make an attempt to submit them to the [Codeberg repository](https://codeberg.org/Alamantus/FeatherWiki) if at all possible. I will not be monitoring the GitHub repo closely, though I should receive email notifications.

## For coders

Feel free to fork this repo and submit pull requests to have your changes or additions reviewed! I might ask for changes
to make the output smaller or improve organization, but as above, I also reserve the right to deny changes outright in favor of a future plugin/code extension system that allows users to inject their own code into their Feather Wiki instead of including it in the base.  

The observant among you may have noticed that there is a [mirror on GitHub](https://github.com/Alamantus/FeatherWiki) (if that's where you're reading this, hello to you!). I will review pull requests from the GitHub mirror, but I request that you make an attempt to submit your pull requests to the [Codeberg repository](https://codeberg.org/Alamantus/FeatherWiki) if at all possible. I will not be monitoring the GitHub repo closely, though I should receive email notifications.

## Translation

Feather Wiki uses JSON files in the `locales` folder to generate builds in languages other than US English (the default language because it's the only language I know).

To create a new translation, fork the repository and copy the [en-US.json](locales/en-US.json) file with the name of the correct locale code you would like to translate to. The `en-US.json` file will always contain all of the required translation strings, so you should make sure your translation includes all of the keys present there. If any translation strings are missing from the file, the US English string will be used in its place.

### Naming the Locale File

The name of the file is used as is inside the resulting HTML file's `lang` attribute, so it must be valid.

You can find the official ISO 639 list of locale codes here: https://www.loc.gov/standards/iso639-2/php/code_list.php. Please use the 2-character ISO 639-1 (set 1) language code whenever possible and only use the 3-character 639-2 (set 2) code if a code from set 1 does not exist. This locale code must be lowercase in the file name, and it must be included in the code list.

### Regions

If you are translating to a regional dialect of a language, for example Spanish in Spain versus Central America, you may specify that in the name of the file, i.e. `es-ES.json` for Spain and `es-013.json` for Central America. You can find all the possible region subtags most conveniently in this JavaScript file from the official r12a language subtag lookup tool: https://github.com/r12a/r12a.github.io/blob/master/apps/subtags/regions.js. There are other ways to create valid language tags, but most of the time, it is unnecessarily complicated to go beyond locale and region codes. If you want to learn more about creating valid language tags, the W3C has a [comprehensive guide](https://www.w3.org/International/questions/qa-choosing-language-tags) for coming up with the exact language tag you are looking for, but it's a bit much for this project.

### Translating

Using the `en-US.json` file as a base to ensure you have all of the required translation keys, replace the English text with the correct translation for your target language. You can search the project files for the `translate` keys in the JSON file if the context is not clear enough from the key alone.

Please ensure that your final JSON is valid; for example, if using quotation marks `"` in a translation string, ensure that they are correctly escaped with backslashes: `\\"`. Likewise, when you encounter variables within the original string, please keep the variable as it appears in the original US English locale file. For example, `imageUsedIn` includes `${i.pgs.length}` in the string for the app to denote the number of pages an image is used in, so it should be used as is in the correct location of the translated sentence.

### Pull Request

Once you've finished your valid JSON translation file, push it to your fork and create a [pull request](https://codeberg.org/Alamantus/FeatherWiki/compare/main...main) with the name "Translation to [language]" where `[language]` is the name of the language you are translating to. The translation file will be reviewed to make sure everything looks valid, and if everything checks out, your translation will be used to create a new Feather Wiki translation! New translations will be linked to from the Downloads page of the Feather Wiki website and included in the Releases list.

### Future Changes

If any new translation strings are added to the project in the future, I may reach out to you to add the translation file so it can remain complete. If you are able to help, it would be very appreciated!

### Extension Translations

If you are interested in translating any extensions that are more word-heavy (like the [Import/Export extension](extensions/data-import-export.js)), you can follow the same process as above, but instead of putting the file in the `locales` folder, simply duplicate the extension file within the `extensions` folder and include the language tag after an underscore in the file name, for example `data-import-export_es-ES.js` for Spain Spanish or `full-search_jp.js` for Japanese.

Once the files have been checked in the pull request, they will be linked to from the extension page on the website.
