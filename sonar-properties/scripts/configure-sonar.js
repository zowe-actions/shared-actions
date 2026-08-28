const fs = require("fs");

function getPrHeadRef(pr) {
    // Prepend repo owner to PR branch name if it comes from a fork
    if (pr.base.repo.full_name === pr.head.repo.full_name) {
        return pr.head.ref;
    } else {
        return `${pr.head.repo.full_name.split("/")[0]}:${pr.head.ref}`;
    }
}

function rewriteCoverageReports(core, properties) {
    // Workaround for https://community.sonarsource.com/t/code-coverage-doesnt-work-with-github-action/16747
    const reportPaths = properties.get("sonar.javascript.lcov.reportPaths");
    if (typeof reportPaths !== "string") {
        core.info("Unable to find the property: 'sonar.javascript.lcov.reportPaths'");
        return;
    }
    core.info("Fixing coverage paths for SonarCloud");
    const pattern = new RegExp(process.env.GITHUB_WORKSPACE, "g");
    for (const reportPath of reportPaths.split(",")) {
        core.debug("Report file: " + reportPath);
        const reportText = fs.readFileSync(reportPath, "utf-8");
        core.debug("Contents before:\n" + reportText);
        fs.writeFileSync(reportPath, reportText.replace(pattern, "/github/workspace"));
        core.debug("Contents after:\n" + fs.readFileSync(reportPath, "utf-8"));
    }
}

module.exports = async ({ github, context, core, require }) => {
    // Append Sonar properties to the sonar-project.properties file
    const properties = require("./java-properties");
    const sonarProps = {};
    const packageJson = JSON.parse(fs.readFileSync(fs.existsSync("lerna.json") ? "lerna.json"
        : "package.json", "utf-8"));
    sonarProps["sonar.projectVersion"] = packageJson.version;
    sonarProps["sonar.links.ci"] =
        `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
    if (context.payload.workflow_run != null) {
        sonarProps["sonar.scm.revision"] = context.payload.workflow_run.head_sha;
    }

    // Gather information about current pull request
    let prData = context.payload.pull_request;
    if (prData == null) {
        core.debug(`Looking through open pull requests`);
        if (context.payload.workflow_run == null) {
            const prs = (await github.rest.repos.listPullRequestsAssociatedWithCommit({
                ...context.repo,
                commit_sha: context.sha
            })).data.filter((pr) => pr.state === "open");
            core.debug(`Found ${prs.length} open pull request(s)`);
            prData = prs.find(pr => context.payload.ref === `refs/heads/${pr.head.ref}`);
        } else {
            const [owner, repo] = context.payload.workflow_run.head_repository.full_name.split("/", 2);
            const repoName = context.payload.workflow_run.repository.full_name;
            const prs = (await github.rest.repos.listPullRequestsAssociatedWithCommit({
                owner, repo,
                commit_sha: context.payload.workflow_run.head_sha
            })).data.filter(pr => pr.base.repo.full_name === repoName);
            core.debug(`Found ${prs.length} open pull request(s) in: ${repoName}`);
            prData = prs.find(pr => pr.state === "open" && pr.head.ref === context.payload.workflow_run.head_branch);
        }
    }

    // Set properties for pull request or branch scanning
    if (prData != null) {
        sonarProps["sonar.pullrequest.key"] = prData.number;
        sonarProps["sonar.pullrequest.branch"] = getPrHeadRef(prData);
        sonarProps["sonar.pullrequest.base"] = prData.base.ref;
    } else {
        sonarProps["sonar.branch.name"] = context.payload.workflow_run?.head_branch
            ?? context.ref.replace(/^refs\/heads\//, "");
    }

    // Convert properties to argument string and store it in output
    core.info("Sonar scan properties:\n" + JSON.stringify(sonarProps, null, 2));
    fs.appendFileSync("sonar-project.properties", Object.entries(sonarProps).map(([k, v]) => `${k}=${v}`).join("\n"));
    core.debug("All Sonar scan properties:\n" + fs.readFileSync("sonar-project.properties", "utf-8"));
    rewriteCoverageReports(core, properties.of("sonar-project.properties"));
}
