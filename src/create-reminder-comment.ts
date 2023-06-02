import * as core from "@actions/core";
import * as github from "@actions/github";

import convertHoursToMilliseconds from "./utils/helpers";

const STATUS_CREATED = 201;

async function createReminderComment(): Promise<void> {
  try {
    const githubToken = core.getInput("github_token");
    const reminderMessage = core.getInput("reminder_message");
    const inactivityDeadlineHours = parseInt(core.getInput("inactivity_deadline_hours"), 10);
    const defaultUsersToNotify = core.getMultilineInput("default_users_to_notify");
    const octokit = github.getOctokit(githubToken);

    const { data: pullRequests } = await octokit.rest.pulls.list({
      ...github.context.repo,
      state: "open",
    });

    if (pullRequests.length === 0) {
      core.info("There are no pull requests, nothing to do.");
      return;
    }

    for (const pullRequest of pullRequests) {
      core.info(`PR title: ${pullRequest.title}`);

      if (pullRequest.draft === true) {
        core.info("This is a draft pull request, skipping.");
        continue;
      }
      const currentTime = new Date().getTime();
      const updated_at = new Date(pullRequest.updated_at).getTime();
      const deadlineTime = updated_at + convertHoursToMilliseconds(inactivityDeadlineHours);

      if (currentTime < deadlineTime) {
        core.info("Deadline not reached, skipping.");
        continue;
      }

      const reviewers = pullRequest.requested_reviewers;
      let reviewersMapping = "";
      if (reviewers && reviewers.length > 0) {
        core.info("The list of reviewers is not empty. Creating a list of users to be notified based on it.");
        reviewersMapping = reviewers.map((reviewer) => `@${reviewer.login}`).join(", ");
      } else {
        core.info("The list of reviewers is empty. Default users will be notified.");
        reviewersMapping = defaultUsersToNotify.join(", ");
      }

      const reminderCommentMessage = `${reviewersMapping} \n${reminderMessage}`;

      core.info(`Message to write: ${reminderCommentMessage}`);
      const response = await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: pullRequest.number,
        body: reminderCommentMessage,
      });

      if (response.status === STATUS_CREATED) {
        core.info(`Reminder created for PR: ${pullRequest.number}`);
      } else {
        core.error(`Failed to create comment for PR: ${pullRequest.number} Response status: ${response.status}`);
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

export default createReminderComment;
