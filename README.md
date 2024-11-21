# github-action-reminder

GitHub Action to send a reminder to the PR that is lacking in activity.

## Input

* `github_token`
  * GitHub Token
  * required
  * Default: "${{ github.token }}"
* `reminder_message`
  * Message to be sent to the PR that is missing in activity.
  * not required
  * Default: "No activity in this PR. Please take some time and check it out."
* `inactivity_deadline_hours`
  * This is the deadline for inactive PR (in hours). If this time is exceeded then a reminder will be sent.
  * not required
  * Default: "48"
* `default_users_to_notify`
  * This is a list of users to be notified in case the list of reviewers is empty. The list of users is in multi-line string format.
  * not required
  * Default: ""

## Setup

Example setup:

> Note: Pay attention to the `if` statement as it should point to the repository name for which the repository is configured. This will prevent it from running on the forks. The repository is of this structure `<your_organization>/<your_repository_name>`.

```yaml
name: "Send reviewer reminder"
on:
  schedule:
    # Run everyday at midnight
    - cron: "0 0 * * *"

jobs:
  review-reminder:
    if: github.repository == 'Sojusan/github-action-reminder'
    runs-on: ubuntu-latest
    steps:
      - uses: sojusan/github-action-reminder@v1
        with:
          reminder_message: "Optional reminder message"
          inactivity_deadline_hours: 24
          default_users_to_notify: |
            @user_login_1
            @user_login_2
```
