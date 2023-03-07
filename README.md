# github-action-reminder

GitHub Action to send a reminder to the PR that is lacking in activity.

## Input

* `github_token`
  * GitHub Token
  * required
* `reminder_message`
  * Message to be sent to the PR that is missing in activity.
  * not required
  * Default: "No activity in this PR. Please take some time and check it out. Don't make this PR sad ;-;"
* `inactivity_deadline_hours`
  * This is the deadline for inactive PR (in hours). If this time is exceeded then a reminder will be sent.
  * not required
  * Default: "48"

## Setup

```yaml
name: "Send reviewer reminder"
on:
  schedule:
    # Run everyday at midnight
    - cron: "0 0 * * *"

jobs:
  review-reminder:
    runs-on: ubuntu-latest
    steps:
      - uses: sojusan/github-action-reminder@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          reminder_message: "Optional reminder message"
          inactivity_deadline_hours: 24
```
