![](http://i.imgur.com/Q7TQYHx.png)
# `$ git-stats`
A GitHub-like contributions calendar, but locally, with all your git commits.

These are all real commits from the last year.

![](http://i.imgur.com/LfLJAaE.png)

## Installation
```sh
$ npm install -g git-stats
```

### Catching the `git commit` command
Would you like to catch and automatically store the commits when you do `git commit`?

#### Using `git` hooks
The way I recommend to track your git commits is to use git hooks. Run the following command to initialize the `post-commit` git hook.

```sh
# Using curl
curl -s https://raw.githubusercontent.com/IonicaBizau/git-stats/master/scripts/init-git-post-commit | bash

# ...or wget
wget -qO- https://raw.githubusercontent.com/IonicaBizau/git-stats/master/scripts/init-git-post-commit | bash
```

Then, you have to run `git init` into your existing git repositories from your local machine (that's because the `post-commit` should be updated). This
step will not be needed after clonning a repository (the git hooks will be added automatically from `~/.git-templates`).

#### Overriding the `git` command
One of the solutions is becoming a mad scientist, overriding the `git` command with a function. However, this may not work for you if you're using `zsh`.

If so, put the following lines in your `~/.bashrc` (or `~/.bash_profile` on OS X) file:

```sh
# Override the Git command
git() {
  cmd=$1
  shift
  extra=""

  quoted_args=""
  whitespace="[[:space:]]"
  for i in "$@"
  do
      quoted_args="$quoted_args \"$i\""
  done

  cmdToRun="`which git` "$cmd" $quoted_args"
  cmdToRun=`echo $cmdToRun | sed -e 's/^ *//' -e 's/ *$//'`
  bash -c "$cmdToRun"
  if [ $? -eq 0 ]; then
    # Commit stats
    if [ "$cmd" == "commit" ]; then
      commit_hash=`git rev-parse HEAD`
      repo_url=`git config --get remote.origin.url`
      commit_date=`git log -1 --format=%cd`
      commit_data="\"{ \"date\": \"$commit_date\", \"url\": \"$repo_url\", \"hash\": \"$commit_hash\" }\""
      git-stats --record "$commit_data"
    fi
  fi
}
```

## Usage

```sh
$ git-stats --help
git-stats --help
A GitHub-like contributions calendar, but locally, with all your git commits.

usage: git-stats [start] [end] [options] [data]

start:                    Optional start date
end:                      Optional end date

options:
  -v                      Displays version information.
  -h --help               Displays this help.
  --no-ansi               Doesn't use ANSI colors in the squares.
  --record <data>         Records a new commit. Don't use this unless you are
                          a mad scientist. If you are a developer, just use this
                          option as part of the module.
  --light                 Enable the light theme.

examples:
   git-stats # Displays your commit calendar
   git-stats -v
   git-stats -h
   git-stats --light # Light mode
   git-stats '1 January 2012' # All the commits from 1 January 2012, to now
   git-stats '1 January 2012' '31 December 2012' # All the commits from 2012

Your commit history is kept in the .git-stats, in your $HOME directory (~/)

Documentation can be found at https://github.com/IonicaBizau/git-stats
```

If you override the `git` command with a function, then your commits will be automatically recorded.

### Importing and deleting commits
I know it's not nice to start your git commit calendar from scratch. That's why I
created a `git-stats-importer` that imports or deletes the commits from a repository.

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
Yes, you read correctly! That's also possible. I [built a tool for that too](https://github.com/IonicaBizau/repository-downloader)!

```sh
# Download the repository downloader
$ git clone git@github.com:IonicaBizau/repository-downloader.git

# Go to repository downloader
$ cd repository-downloader

# Install the dependencies
$ npm install

# Start downloading and importing
$ ./start
```

### See the GitHub Contributions calendar
There is a solution for that, too! :smile: It's called [`ghcal`](https://github.com/IonicaBizau/ghcal).

```sh
# Install ghcal
$ npm install -g ghcal

# Checkout my contributions
$ ghcal ionicabizau
```

Fore more detailed documentation, check out the repository: https://github.com/IonicaBizau/ghcal.


## Documentation
If you want to use this as a module, that is possible. See the content below.

### `record(data, callback)`
Records a new commit.

#### Params
- **Object** `data`: The commit data containing:
 - `date` (String|Date): The date object or a string in a format that can be parsed.
 - `url` (String): The repository remote url.
 - `hash` (String): The commit hash.

- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` object.

### `get(callback)`
Gets the git stats.

#### Params
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` object.

### `save(stats, callback)`
Saves the provided stats.

#### Params
- **Object** `stats`: The stats to be saved.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` object.

### `iterateDays(data, callback)`
Iterate the days, calling the callback function for each day.

#### Params
- **Object** `data`: An object containing the following fields:
 - `start` (Moment): A `Moment` date object representing the start date (default: *an year ago*).
 - `end` (Moment): A `Moment` date object representing the end date (default: *now*).
 - `format` (String): The format of the date (default: `"MMM D, YYYY"`).

- **Function** `callback`: The callback function called with the current day formatted (type: string) and the `Moment` date object.

#### Return
- **GitStats** The `GitStats` object.

### `graph(data, callback)`
Creates an object with the stats on the provided period (default: *last year*).

#### Params
- **Object** `data`: The object passed to the `iterateDays` method.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` object.

### `calendar(data, callback)`
Creates the calendar data for the provided period (default: *last year*).

#### Params
- **Object** `data`: The object passed to the `graph` method.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` object.

### `ansiCalendar(data, callback)`
Creates the ANSI contributions calendar.

#### Params
- **Object** `data`: The object passed to the `calendar` method.
- **Function** `callback`: The callback function.

#### Return
- **GitStats** The `GitStats` object.


## How to contribute

1. File an issue in the repository, using the bug tracker, describing the
   contribution you'd like to make. This will help us to get you started on the
   right foot.
2. Fork the project in your account and create a new branch:
   `your-great-feature`.
3. Commit your changes in that branch.
4. Open a pull request, and reference the initial issue in the pull request
   message.

## License
See the [LICENSE](./LICENSE) file.
