# Feather Wiki Nests

Nests enable hosting Feather Wiki's Warbler version on a web server in a way that allows you to
make edits and save directly to your server without needing to save the files to your computer
first. You will need to ensure that your web server is as secure as necessary on your own because
these nests only use a simple username & password to ensure that it's an admin making changes.

This list will hopefully grow to include more languages and/or server software as interest in
the server-saving functionality grows.

## Caddy Server

The `Caddyfile.example` file provides a framework and instructions (in the comments) for how
to use [Caddy 2](https://caddyserver.com) with the [WebDAV plugin](https://caddyserver.com/download?package=github.com%2Fmholt%2Fcaddy-webdav)
to set up a nest using _only_ the Caddy server—no extra language script required!

You will need to update the `Caddyfile` to meet your individual needs.

## PHP

The `index.php` file provides a way to set up a nest in the same directory as the script file
using PHP. The first time you visit the script, it will make you set a username and password and
then create a new `featherwiki.html` file for you from the most recent version. You should then be
able to simply visit the directory where your `index.php` file lives to view your new Feather Wiki.
If you have an existing Feather Wiki you want to host, simply open the empty one and use the "Import
& Overwrite" button to import your old wiki into your new, hosted one.

Note: The username and password are hashed together and saved in a `.featherwikiadmin` file as
well, so you will need to set up your server to prevent download access to this file!
