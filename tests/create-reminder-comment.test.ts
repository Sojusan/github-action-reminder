import { describe, expect, test, beforeEach, beforeAll } from "@jest/globals";
import * as github from "@actions/github";
import * as core from "@actions/core";

import createReminderComment from "../src/create-reminder-comment";

describe("Create Reminder Comment", () => {
  const fakeGitHubToken = "fake-token";
  const octokitMock = github.getOctokit(fakeGitHubToken);
  let customInputReminderMessage;
  let customInputInactivityDeadlineHours;
  let pullsListMock;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-03-01T20:00:00Z"));
  });

  // Mock the actions/core functionality
  beforeEach(() => {
    jest.spyOn(github, "getOctokit").mockImplementation(() => octokitMock);
    // GitHub.getOctokit = jest.fn().mockReturnValue(() => octokitMock);
    jest.spyOn(github.context, "repo", "get").mockReturnValue({ owner: "test-owner", repo: "test-repo" });

    jest.spyOn(core, "info");
    jest.spyOn(core, "error");
    jest.spyOn(core, "setFailed");
    jest.spyOn(core, "getMultilineInput");
    jest.spyOn(core, "getInput").mockReturnValueOnce(fakeGitHubToken);
  });

  test("error occurred", async () => {
    jest.spyOn(octokitMock.rest.pulls, "list").mockImplementation(() => {
      throw new Error("The big terrible error has arrived!");
    });
    await createReminderComment();
    expect(core.getInput).toBeCalledTimes(3);
    expect(core.getMultilineInput).toBeCalledTimes(1);
    expect(core.setFailed).toBeCalledTimes(1);
    expect(core.setFailed).lastCalledWith("The big terrible error has arrived!");
  });

  test("no pull requests", async () => {
    pullsListMock = { data: [] };
    jest.spyOn(octokitMock.rest.pulls, "list").mockResolvedValue(pullsListMock);
    await createReminderComment();
    expect(core.getInput).toBeCalledTimes(3);
    expect(core.getMultilineInput).toBeCalledTimes(1);
    expect(core.info).toBeCalledTimes(1);
    expect(core.info).lastCalledWith("There are no pull requests, nothing to do.");
  });

  test("draft pull request", async () => {
    pullsListMock = {
      data: [
        {
          title: "last-hope",
          draft: true,
        },
      ],
    };
    jest.spyOn(octokitMock.rest.pulls, "list").mockResolvedValue(pullsListMock);
    await createReminderComment();
    expect(core.getInput).toBeCalledTimes(3);
    expect(core.getMultilineInput).toBeCalledTimes(1);
    expect(core.info).toBeCalledTimes(2);
    expect(core.info).toHaveBeenNthCalledWith(1, `PR title: ${pullsListMock.data[0].title}`);
    expect(core.info).toHaveBeenNthCalledWith(2, "This is a draft pull request, skipping.");
  });

  test("deadline not reached", async () => {
    pullsListMock = {
      data: [
        {
          title: "the-new-hope",
          draft: false,
          updated_at: "2023-03-01T19:00:01Z",
        },
      ],
    };
    customInputReminderMessage = "test";
    customInputInactivityDeadlineHours = 1;
    jest.spyOn(core, "getInput").mockReturnValueOnce(customInputReminderMessage);
    jest.spyOn(core, "getInput").mockReturnValueOnce(customInputInactivityDeadlineHours);
    jest.spyOn(octokitMock.rest.pulls, "list").mockResolvedValue(pullsListMock);
    await createReminderComment();
    expect(core.getInput).toBeCalledTimes(3);
    expect(core.getMultilineInput).toBeCalledTimes(1);
    expect(core.info).toBeCalledTimes(2);
    expect(core.info).toHaveBeenNthCalledWith(1, `PR title: ${pullsListMock.data[0].title}`);
    expect(core.info).toHaveBeenNthCalledWith(2, "Deadline not reached, skipping.");
  });

  test.each([[[{ login: "test 1" }]], [[{ login: "test 1" }, { login: "test 2" }]]])(
    "message for reviewers",
    async (reviewers) => {
      pullsListMock = {
        data: [
          {
            title: "the-new-hope",
            draft: false,
            updated_at: "2023-03-01T19:00:00Z",
            requested_reviewers: reviewers,
            number: 1,
          },
        ],
      };
      customInputReminderMessage = "This is a really nice message for reviewers.";
      const reviewers_formatted = pullsListMock.data[0].requested_reviewers
        .map((reviewer) => `@${reviewer.login}`)
        .join(", ");
      const reminderCommentMessage = `${reviewers_formatted} \n${customInputReminderMessage}`;
      customInputInactivityDeadlineHours = 1;
      jest.spyOn(core, "getInput").mockReturnValueOnce(customInputReminderMessage);
      jest.spyOn(core, "getInput").mockReturnValueOnce(customInputInactivityDeadlineHours);
      jest.spyOn(octokitMock.rest.pulls, "list").mockResolvedValue(pullsListMock);
      jest.spyOn(octokitMock.rest.issues, "createComment").mockResolvedValue({ status: 201 } as any);
      await createReminderComment();
      expect(core.getInput).toBeCalledTimes(3);
      expect(core.getMultilineInput).toBeCalledTimes(1);
      expect(core.info).toBeCalledTimes(4);
      expect(core.info).toHaveBeenNthCalledWith(1, `PR title: ${pullsListMock.data[0].title}`);
      expect(core.info).toHaveBeenNthCalledWith(
        2,
        "The list of reviewers is not empty. Creating a list of users to be notified based on it."
      );
      expect(core.info).toHaveBeenNthCalledWith(3, `Message to write: ${reminderCommentMessage}`);
      expect(core.info).toHaveBeenNthCalledWith(4, `Reminder created for PR: ${pullsListMock.data[0].number}`);
    }
  );

  test.each([[[""]], [["@login1"]], [["@login1", "@login2"]]])(
    "reviewers empty list, default users will be used",
    async (default_users) => {
      pullsListMock = {
        data: [
          {
            title: "the-new-hope",
            draft: false,
            updated_at: "2023-03-01T19:00:00Z",
            requested_reviewers: [],
            number: 1,
          },
        ],
      };
      customInputReminderMessage = "This is a really nice message for reviewers.";
      const reviewers_formatted = default_users.join(", ");
      const reminderCommentMessage = `${reviewers_formatted} \n${customInputReminderMessage}`;
      customInputInactivityDeadlineHours = 1;
      jest.spyOn(core, "getInput").mockReturnValueOnce(customInputReminderMessage);
      jest.spyOn(core, "getInput").mockReturnValueOnce(customInputInactivityDeadlineHours);
      jest.spyOn(core, "getMultilineInput").mockReturnValueOnce(default_users);
      jest.spyOn(octokitMock.rest.pulls, "list").mockResolvedValue(pullsListMock);
      jest.spyOn(octokitMock.rest.issues, "createComment").mockResolvedValue({ status: 201 } as any);
      await createReminderComment();
      expect(core.getInput).toBeCalledTimes(3);
      expect(core.getMultilineInput).toBeCalledTimes(1);
      expect(core.info).toBeCalledTimes(4);
      expect(core.info).toHaveBeenNthCalledWith(1, `PR title: ${pullsListMock.data[0].title}`);
      expect(core.info).toHaveBeenNthCalledWith(2, "The list of reviewers is empty. Default users will be notified.");
      expect(core.info).toHaveBeenNthCalledWith(3, `Message to write: ${reminderCommentMessage}`);
      expect(core.info).toHaveBeenNthCalledWith(4, `Reminder created for PR: ${pullsListMock.data[0].number}`);
    }
  );

  test("error during comment creation", async () => {
    const responseStatusCode = 500;
    pullsListMock = {
      data: [
        {
          title: "the-new-hope",
          draft: false,
          updated_at: "2023-03-01T19:00:00Z",
          requested_reviewers: [],
          number: 1,
        },
      ],
    };
    customInputReminderMessage = "This is a really nice message for reviewers.";
    const reviewers_formatted = pullsListMock.data[0].requested_reviewers
      .map((reviewer) => `@${reviewer.login}`)
      .join(", ");
    const reminderCommentMessage = `${reviewers_formatted} \n${customInputReminderMessage}`;
    customInputInactivityDeadlineHours = 1;
    jest.spyOn(core, "getInput").mockReturnValueOnce(customInputReminderMessage);
    jest.spyOn(core, "getInput").mockReturnValueOnce(customInputInactivityDeadlineHours);
    jest.spyOn(octokitMock.rest.pulls, "list").mockResolvedValue(pullsListMock);
    jest.spyOn(octokitMock.rest.issues, "createComment").mockResolvedValue({ status: responseStatusCode } as any);
    await createReminderComment();
    expect(core.getInput).toBeCalledTimes(3);
    expect(core.getMultilineInput).toBeCalledTimes(1);
    expect(core.info).toBeCalledTimes(3);
    expect(core.info).toHaveBeenNthCalledWith(1, `PR title: ${pullsListMock.data[0].title}`);
    expect(core.info).toHaveBeenNthCalledWith(2, "The list of reviewers is empty. Default users will be notified.");
    expect(core.info).toHaveBeenNthCalledWith(3, `Message to write: ${reminderCommentMessage}`);
    expect(core.error).toBeCalledTimes(1);
    expect(core.error).lastCalledWith(
      `Failed to create comment for PR: ${pullsListMock.data[0].number} Response status: ${responseStatusCode}`
    );
  });
});
