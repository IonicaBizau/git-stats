# git-stats
A GitHub-like contributions calendar, but locally, with all your git commits.

## Installation

```sh
$ npm install -g git-stats
```

### Catching the `git commit` command
Would you like to catch store automatically the commits when you do `git commit`?

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

Your commit history is keept in the .git-stats, in your $HOME directory (~/)

Documentation can be found at https://github.com/IonicaBizau/git-stats
```

If you overriden the `git` command with a function, then your commits will be automatically recorded.

### Importing and deleting commits
I know it's not nice to start from scratch your git commit calendar. That's why I
created a `git-stats` importer, that imports or deletes the commits from a repository.

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
Yes, you read correctly! That's also possible.

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

## Documentation
If you want to use this as module, this is possible. See the content below.

### `record(data, callback)`
Records a new commit.

#### Params
- **Object** `data`: The commit data containing:
 - `date` (String|Date): The date object or a string in this format: `DDD MMM dd HH:mm:ss YYYY`
 - `url` (String): The repository remote url.
 - `hash` (String): The commit hash.

- **Function** `callback`: The callback function.

### `get(data, callback)`
Gets the git stats.

#### Params
- **Object** `data`: The stats filter. **Not yet implemented**.
- **Function** `callback`: The callback function.

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
