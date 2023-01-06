<?php
$method = $_SERVER["REQUEST_METHOD"];
$adminFilename = './.featherwikiadmin';
$wikiFilename = './featherwiki.html';

switch ($_SERVER['REQUEST_METHOD']) {
  case 'PUT': {
    $loggedIn = isset($_SERVER['PHP_AUTH_USER'])
      && isset($_SERVER['PHP_AUTH_PW'])
      && password_verify("{$_SERVER['PHP_AUTH_USER']}:{$_SERVER['PHP_AUTH_PW']}", file_get_contents($adminFilename));
    if (!$loggedIn) {
      header('WWW-Authenticate: Basic realm="Feather Wiki Nest"');
      header('HTTP/1.1 401 Unauthorized');
      echo 'Access denied!';
      exit;
    } else {
      file_put_contents($wikiFilename, file_get_contents("php://input"));
    }
    break;
  }

  case 'POST': {
    if (file_exists($adminFilename)) {
      header('HTTP/1.1 403 Forbidden');
      echo 'Credentials have already been set!';
      exit;
    }
    try {
      file_put_contents($adminFilename, password_hash("{$_POST['username']}:{$_POST['password']}", PASSWORD_DEFAULT));
      header('HTTP/1.1 201 Created');
    } catch (\Exception $ex) {
      header('HTTP/1.1 ' . $ex->getCode());
      echo '<p>' . $ex->getMessage() . '</p>';
      echo '<p><a href="' . $_SERVER['REQUEST_URI'] . '">Go back</a></p>';
      exit;
    }
    break;
  }

  case 'OPTIONS': {
    header('HTTP/1.1 200 OK');
    header('dav: 1');
    exit;
    break;
  }
}

if (!file_exists($adminFilename)) {
  header('Content-Type: text/html; charset=UTF-8');
  echo <<<PAGE
<html>
<head>
<title>Set Up</title>
<style>
html {
  font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
  margin: 0;
  padding: 0;
}
html, button, input {
  font-size: 12pt;
  background: #fff;
  color: #000;
}
body {
  padding: 1rem 1.5rem 2rem;
}
:focus {
  outline: 2px solid #000;
}
* {
  box-sizing: border-box;
  position: relative;
  max-width: 100vw;
}
* + *, p {
  margin: .5rem 0;
}
label { display: block; }
input {
  padding: .5rem;
  border: 1px solid #000;
  border-radius: 3px;
}
h1 {
  font-weight: bold;
  margin: .5rem 0;
  font-size: 1.8rem;
}
button {
  text-align: center;
  color: #fff;
  padding: 5px 12px;
  background-color: #65A;
  border: 0;
  border-radius: 1rem;
  z-index: 2;
  cursor: pointer;
}
</style>
</head>
<body>
  <h1>Welcome to your Feather Wiki nest!</h1>
  <p>Please set your username and password for saving changes to Feather Wiki:</p>
  <form action="{$_SERVER['REQUEST_URI']}" method="POST">
    <label>Username <input name=username></label>
    <label>Password <input name=password type=password></label>
    <p><strong>These values are CASE SENSITIVE so please keep track of what you enter here!</strong></p>
    <p><em>The only way to change your password is to delete the <code>.featherwikiadmin</code> file to display this form again.</em></p>
    <button type=submit>Set Credentials</button>
  </form>
</body>
</html>
PAGE;
  exit;
}

if (!file_exists($wikiFilename)) {
  file_put_contents($wikiFilename, file_get_contents('https://feather.wiki/builds/FeatherWiki_Warbler.html'));
}

header('Content-Type: text/html; charset=UTF-8');
echo file_get_contents($wikiFilename);
