# Changelog

> Date format is DD.MM.YYYY.

[1.1.1] - 21.11.2024

- Dependencies updated.
- Added a default value for the `github_token` value, so setting it explicitly is no longer needed.
- Updated `README.md` to include the information about the `if` sections which could be used to prevent running this action on the forks.
- Updated the version of the used node to `22`.

[1.1.0] - 02.06.2023

- Added `default_users_to_notify` option for specifying the default users to be notified if reviewers list is empty.

[1.0.1] - 13.03.2023

- Added log entry about no pull requests.
- Added unit tests.
- Added jest, prettier and eslint configurations.
- Added a GitHub workflow for running unit tests and checking the dist package.

[1.0.0] - 07.03.2023

- Initial release
