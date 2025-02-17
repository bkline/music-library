# Music Library

This is a web application for managing the music library of an
active performing organization. It was originally implemented
for the music program of the Unitarian Universalist Church of
Arlington, Virginia.

## Background

When support for the version of PHP on which the music library
catalog software was running expired we decided to modernize
the application, using React/Bootstrap for the front end and
PHP for the back end.

Improvements include:

* better performance
* more modern appearance
* mobile-friendly
* consistent menu on all pages
* manager functions (edit accounts, view audit trail, etc.)
* more powerful and intuitive catalog search capabilities
* more intuitive paging interface for search results
* collapsible field sets on the editing form
* typeahead support when selecting from long lists
* better support for adding/deleting repeatable blocks
* support for managing lookup tables
* more intuitive interface for filtering in reports
* eliminated dependence on the browser's Back button
* cleaner, more modular code
* a supported version of PHP

## Requirements

You should be able to host this application on any reasonably capable
web hosting service, as long as it supports a modern version of PHP
(8.3 or higher recommended), and the ability to connect with the server
using an SSH client and install software in the account's home directory.
If they are not already provided by the hosting service, you will need
to install [`composer`](https://getcomposer.org/) (a dependency manager
for PHP, with which you can install the third-party packages needed by
the back-end API) and [`npm`](https://www.npmjs.com/), which supplies
comparable functionality for third-party JavaScript packages, which the
front end uses. Connect to your server using `ssh` and use the
following procedures to install the necessary tools.

### PHP

Make sure your hosting service supports PHP 8.3 or higher. Run this
command to find out which version is installed.

```
php -v
```

If a version lower than 8.3 is installed, use your service's management
interface (typically **cPanel**) to select a higher version. Reach out
to the service's support team if you don't see a way to upgrade the
version of PHP which is configured.

### Composer

First, check to see if your hosting service already provides `composer`.
Connect to your server using `ssh` and run the command

```
composer -V
```

If you see output which tells you which version of `composer` is
installed you won't need to install it yourself. If instead you see
an error message saying the command was not found, follow these steps
to install it.

1. Download `composer`
```
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
```
2. Install `composer` locally to your home directory.
```
mkdir -p $HOME/bin
php composer-setup.php --install-dir=$HOME/bin --filename=composer
```
3. Make sure the command can be found by adding the following line to
`.bashrc` or `.bash_profile` in your home directory (if it's not
already there).
```
export PATH=$HOME/bin:$PATH
```
4. Reload your profile:
```
source ~/.bashrc # or source ~/.bash_profile
```
5. Verify installation
```
composer -V
```
6. Clean up
```
rm composer-setup.php
```

### NPM (Node Package Manager)

Assuming `npm` is not provided already by your hosting service (which it
usually isn't for most shared hosting services), follow these steps to
install it locally in your home directory.

1. Install `nvm` (the node version manager)
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```
2. Configure `nvm`
```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```
3. Use `nvm` to install `node` and `npm`
```
nvm install node
```
4. Verify the installation
```
node -v
npm -v
```

## Installing the Music Library Database

These instructions assume the use of MySQL as the DBMS for the application,
as that is the most widely supported option for shared web hosting services.
Obviously, you will want to substitute your own password for the database
account.

1. Create the `music_library` database, using your hosting provider's
management interface, or if you are running your own database server,
issue the following in the `mysql` client connected using the account
used for creating new databases.
```
CREATE DATABASE music_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
2. Create the `music_library` user account and add the user to the database.
Again, if you are managing your own DBMS:
```
CREATE USER 'music_library'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON music_library.* TO 'music_library'@'localhost';
FLUSH PRIVILEGES;
```
3. Create the tables using `db/create-tables-mysql.sql` with your service
provider's database import facility; or
```
mysql -u music_library -p music_library < db/create-tables-mysql.sql
```
4. Import the initial values by uploading `db/music-library.sql`; or
```
mysql -u music_library -p music_library < db/music-library.sql
```

If you are migrating the application from another server where it has
already been running, use the backup from the database on that server
instead of steps 3 and 4.

## Installing the Music Library Software

Follow these steps to set up the application on your server, whether you
are installing it for the first time, or migrating from one hosting service
to another. It is intended to be served from a subdirectory of your web site,
sharing the site with other applications (_e.g._, https://example.org/library),
but it would not be too difficult to modify it to run at the root of the site,
dedicating the entire site to the music library application. The steps as given
here are for installations for which source code control will be managed
exclusively on the hosting server. If you prefer to manage your own repository
on GitHub you will want to first fork this repository and substitute your own
URL for cloning it to the hosting server.

1. Pull the repository for the application to your home directory, outside
the directory where web pages are served.
```
cd ~
git clone https://github.com/bkline/music-library.git
```
2. Install the third-party packages needed by the application.
```
cd music-library
composer install
npm install
```
3. Build the front-end files.
```
npx vite build
```
4. Configure the database credentials by copying `db/secrets-mysql.json`
to `api/secrets.json` and editing the copy to replace the host name and
password with the values appropriate for your installation. Also change
the database name and account name if yours differ from the defaults.

5. Copy the files needed by the web server. Substitute the root directory
used by your own web server for `~/public_html` in these commands.
```
ROOT=~/public_html
mkdir -p $ROOT/library
cp -r api dist vendor $ROOT/library/
cp config.json .htaccess $ROOT/library
```

6. Connect your browser to the new site (for example,
https://example.com/library/) and create an admin account as instructed
on the page which appears.

7. Log into the application with the credentials of the account you
just created. Review the online manual (choose the *Help* menu) for
guidance on creating new records, managing the lookup tables and user
accounts, and generating reports.

## Modifying the Software

When you make changes to the front end code (`src/*.jsx` or `index.html`),
you will need to rebuild with `npx vite build` and copy the `dist` directory
to the location from which the site is processed by the web server. If you
make changes to the back end code or configuration (`api/*`) you need only
copy the modified files to the live `api` subdirectory; there is no rebuild
needed for those files. If you modify `config.json` at the root of the project,
you will need to rebuild (`npx vite build`), copy the `dist` directory to
the live site, and copy the modified `config.json` to the live site as well,
since the back end code also reads that configuration file (in addition to
`api/config.json`).

## Maintenance Mode

When you need to ensure that non-administrative users do not have access
to the site, create the file `maintenance-mode` in the `library` subdirectory
of the live site. It doesn't matter what the contents of the file are, and
in fact the file can be empty. As noted above in the installation
instructions, substitute the root directory of your own web server
for `~public_html`.
```
ROOT=~/public_html
touch $ROOT/library/maintenance-mode
```
Within a minute all non-administrators will have their current page
transformed into a placeholder page explaining that the site is in
maintenance mode. If a user was working on editing a record her work
will be lost, so it's always a good idea to announce planned maintenance
in advance if at all possible. An admistrative account which is currently
logged in when the site goes into maintenance mode will be able to
continue working, but if you log out you won't be able to log back in
until the site is taken back out of maintenance mode. To do that simply
remove the `maintenance-mode` file.
```
ROOT=~/public_html
rm $ROOT/library/maintenance-mode
```

## Docker

If you do not have access to a second server on which to install a copy
of the application for development and testing, and you are comfortable
using Docker, you can set up a Docker container on a development
machine for the purpose. If you don't already have Docker installed,
follow the instructions at https://docs.docker.com/get-started/get-docker/
and then run the following commands.

```
git clone https://github.com/bkline/music-library.git
cd music-library
docker compose build
docker compose up -d
```

Open http://localhost:8888/library in your browser. Follow the
instructions for creating an administrative account, record the
username and password you provided for the account, and use those
credentials to log into the application, create other accounts,
create records, and run reports.

To stop the container, preserving it and its state, run
```
docker compose stop
```
To have the container resume, run
```
docker compose start
```
To remove the container (and any data in the database):
```
docker compose down
```
To recreate the container after that command, run
```
docker compose up -d
```
If you change anything in the docker configuration files or the
docker startup script, you can run those two commands in succession:
```
docker compose down
docker compose up -d
```
It is also possible to rebuild the front end without destroying the
container (thus preserving the data in the database) by running
```
docker exec -it music-library bash
```
to open a shell inside the container. In that shell, run
```
npx vite build
```
Type `exit` (or press **Control+D**) to leave the container.

There is no need to rebuild anything when you make changes to the
back end PHP code. Those changes will take effect immediately.

## Testing

If you make changes to the software, it is a good idea to run tests
to make sure your changes did not break anything in the application.
There is a suite of tests which can be used in a non-production
environment. You will need to set up Python (3.10 or higher) with
the third-party packages openpyxl (3.1.2+), requests (2.31.0+), and
selenium (4.0.0+) installed. A Python virtual environment is the
most effective way to achieve this. If you are testing a server
running in a Docker container, you will be running the tests
from the host machine (not from within the container), because
the tests run in an actual browser (see the next paragraph), and
the Docker container does not have a graphical interface.

You will also need to install Chrome for Testing (120.0+) from
https://googlechromelabs.github.io/chrome-for-testing/.
Under the *Stable* version list, choose the `chrome` option which
matches your operating system (not `chromedriver` or
`chrome-headless-shell`). Copy the URL for that option to the
clipboard and paste it into a new browser tab. When the zipfile
for the test browser is downloaded, unpack it. You can add the
directory for the unzipped package to your search `PATH`, but
it appears that the testing engine is able to find the test
browser even if you leave out that step.
The most efficient way to run the tests involves launching Chrome
for Testing before invoking the test script, but if you don't do
that the test harness will do it for you.

Finally, you will need to supply the credentials for an account that
has write access to the Music Library Catalog (but not administrative
privileges). One thing to note is that if you don't pick a good
password for this account the tests may fail because the test browser
puts up a blocking dialog box complaining that the password which was
used is known to have been compromised. So you should pick a reasonably
good password, even if the environment in which the tests are run is
completely inaccessible from outside the test machine. I've only seen
this happen on Windows, but it's possible that a later version of Chrome
for Testing will exhibit this behavior on other platforms as well.

With a perfect test suite, any of the tests could be run independently.
However, some of these tests assume that the first test has been run,
creating a test item, so in most cases you will need to run the suite
in its entirety. It doesn't take much more than 10 minutes (more like
15-20 minutes on Windows). It is usually best to avoid doing anything
else on the computer where the tests are running, as the test browser
will frequently take over focus as the active foreground application,
so keyboard events you were intending for some other application will be
instead directed to the test browser, possibly causing a test to fail.

**Do not run these tests against your production server.**

```
cd tests
python3 -m venv venv # on Windows: py -m venv venv
source venv/bin/activate # on Windows: venv\scripts\activate.bat
pip install openpyxl requests selenium
# Show the command-line arguments.
python test-ml.py --help
# Substitute your own values here.
python test-ml.py --b http://localhost:8888 -u tester -p test-password
```
