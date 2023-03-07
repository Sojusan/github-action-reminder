import * as core from "@actions/core"
import * as github from "@actions/github"

function convertHoursToMilliseconds(hours: number): number {
    return 1000 * 60 * 60 * hours;
}

async function run(): Promise<void> {
    try {
        const githubToken = core.getInput("github_token");
        const reminderMessage = core.getInput("reminder_message");
        const inactivityDeadlineHours = parseInt(core.getInput("inactivity_deadline_hours"));
        const octokit = github.getOctokit(githubToken);

        const {data: pullRequests} = await octokit.rest.pulls.list({
            ...github.context.repo,
            state: "open"
        });
        for (const pullRequest of pullRequests) {
            core.info(`PR title: ${pullRequest.title}`);

            if (pullRequest.draft === true) {
                core.info("This is a draft pull request, skipping.");
                continue
            }
            const currentTime = new Date().getTime();
            const deadlineTime = new Date(pullRequest.updated_at).getTime() +
                convertHoursToMilliseconds(inactivityDeadlineHours);

            if (currentTime < deadlineTime) {
                core.info("Deadline not reached, skipping.");
                continue
            }

            const reviewers = pullRequest.requested_reviewers?.map(reviewer => `@${reviewer.login}`).join(", ");
            const reminderCommentMessage = `${reviewers} \n${reminderMessage}`

            core.info(`Message to write: ${reminderCommentMessage}`)
            await octokit.rest.issues.createComment({
                ...github.context.repo,
                issue_number: pullRequest.number,
                body: reminderCommentMessage
            });
            core.info(`Reminder created for PR: ${pullRequest.number}`);
        }

    } catch (error: any) {
        core.setFailed(error.message);
    }
}

run();
