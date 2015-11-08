[![git-stats](http://i.imgur.com/Q7TQYHx.png)](#)

# `$ git-stats` [![Support this project][donate-now]][paypal-donations]
Local git statistics including GitHub-like contributions calendars.

I'd be curious to see your calendar with all your commits. Ping me on Twitter ([**@IonicaBizau**](https://twitter.com/IonicaBizau)). :smile: Until then, here's my calendar:

![](http://i.imgur.com/PpM0i3v.png)

## Contents

 - [Installation](#installation)
 - [Usage](#usage)
    
     - [Importing and deleting commits](#importing-and-deleting-commits)
     - [Importing all the commits from GitHub and BitBucket](#importing-all-the-commits-from-github-and-bitbucket)
     - [What about the GitHub Contributions calendar?](#what-about-the-github-contributions-calendar)
    
 - [Documentation](#documentation)
 - [How to contribute](#how-to-contribute)

## Installation

You can install the package globally and use it as command line tool:

```sh
# Install the package globally
npm i -g <%- _.pack.name %>
# Initialize git hooks
# This is for tracking the new commits
curl -s https://raw.githubusercontent.com/IonicaBizau/git-stats/master/scripts/init-git-post-commit | bash
```

Then, run `git-stats --help` and see what the CLI tool can do.

```sh
$ git-stats --help
Usage: git-stats [options]

Options:
  -s, --since <date>     Optional start date.                             
  -u, --until <date>     Optional end date.                               
  -n, --no-ansi          Forces the tool not to use ANSI styles.          
  -l, --light            Enables the light theme.                         
  -a, --authors          Shows a pie chart with the author related        
                         contributions in the current repository.         
  -g, --global-activity  Shows global activity calendar in the current    
                         repository.                                      
  -d, --data <path>      Sets a custom data store file.                   
  -f, --first-day <day>  Sets the first day of the week.                  
  --record <data>        Records a new commit. Don't use this unless you  
                         are a mad scientist. If you are a developer, just
                         use this option as part of the module.           
  -r, --raw              Outputs a dump of the raw JSON data.             
  -h, --help             Displays this help.                              
  -v, --version          Displays version information.                    

Examples:
  git-stats # Default behavior (stats in the last year)
  git-stats -l # Light mode
  git-stats -s '1 January 2012' # All the commits from 1 January 2012 to now
  git-stats -s '1 January 2012' -u '31 December 2012' # All the commits from 2012

Your commit history is kept in ~/.git-stats by default. You can create ~/.git-stats-config.json to specify different defaults.

Documentation can be found at https://github.com/IonicaBizau/git-stats
```

## Usage
### Importing and deleting commits

I know it's not nice to start your git commit calendar from scratch. That's why I created [`git-stats-importer`](https://github.com/IonicaBizau/git-stats-importer)–a tool which imports or deletes the commits from selected repositories.

Check it out here: https://github.com/IonicaBizau/git-stats-importer

The usage is simple:

```sh
# Install the importer tool
$ npm install -g git-stats-importer

# Go to the repository you want to import
$ cd path/to/my-repository

# Import the commits
$ git-stats-importer

# ...or delete them if that's a dummy repository
$ git-stats-importer --delete
```
### Importing all the commits from GitHub and BitBucket

Yes, that's also possible. I [built a tool which downloads and then imports all the commits you have pushed to GitHub and BitBucket](https://github.com/IonicaBizau/repository-downloader)!

```sh
# Download the repository downloader
$ git clone https://github.com/IonicaBizau/repository-downloader.git

# Go to repository downloader
$ cd repository-downloader

# Install the dependencies
$ npm install

# Start downloading and importing
$ ./start
```
### What about the GitHub Contributions calendar?

If you want to visualize the calendars that appear on GitHub profiles, you can do that using [`ghcal`](https://github.com/IonicaBizau/ghcal).

```sh
# Install ghcal
$ npm install -g ghcal

# Check out @alysonla's contributions
$ ghcal -u alysonla
```

For more detailed documentation, check out the repository: https://github.com/IonicaBizau/ghcal.

If want to get even more GitHub stats in your terminal, you may want to try [`github-stats`](https://github.com/IonicaBizau/github-stats)--this is like `git-stats` but with data taken from GitHub.

## Using the configuration file

You can tweak the git-stats behavior using a configuration file in your home directory: `~/.git-stats-config.js`.

This file should export an object, like below (defaults are listed):

```js
module.exports = {
    // "DARK", "LIGHT" or an object interpreted by IonicaBizau/node-git-stats-colors
    "theme": "DARK"

    // The file where the commit hashes will be stored
  , "path": "~/.git-stats"

    // First day of the week
  , first_day: "Sun"

    // This defaults to *one year ago*
    // It can be any parsable date
  , since: undefined

    // This defaults to *now*
    // It can be any parsable date
  , until: undefined

    // Don't show authors by default
    // If true, this will enable the authors pie
  , authors: false

    // No global activity by default
    // If true, this will enable the global activity calendar in the current project
  , global_activity: false
};
```

Since it's a js file, you can `require` any other modules there.

## Cross-platform compatibility

`git-stats` is working fine in terminal emulators supporting ANSI styles. It should work fine on Linux and OS X.

If you run `git-stats` to display graph on Windows, please use a terminal that can properly display ANSI colors.

Cygwin Terminal is known to work, while Windows Command Prompt and Git Bash do not. Improvements are more than welcome! :dizzy:

## Example

Here is an example how to use this package as library. To install it locally, as library, you can do that using `npm`:

```sh
$ npm i git-stats
```

```js
// Dependencies
var GitStats = require("git-stats");

// Create the GitStats instance
var g1 = new GitStats();

// Display the ansi calendar
g1.ansiCalendar({
    theme: "DARK"
}, function (err, data) {
    console.log(err || data);
});
```

## Documentation

For full API reference, see the [DOCUMENTATION.md][docs] file.

## Press Highlights

 - [*A GitHub-like contributions calendar, but locally, with all your git commits*, The Changelog](https://changelog.com/github-like-contributions-calendar-locally-git-commits/)

## How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

## Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:

 - [`git-stats-importer`](https://github.com/IonicaBizau/git-stats-importer)

## License

[KINDLY][license] © [Ionică Bizău][website]

[license]: http://ionicabizau.github.io/kindly-license/?author=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica@gmail.com%3E&year=2015

[website]: http://ionicabizau.net
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md