const QUERIES = {
    GET_DISCUSSIONS: `query($owner:String!, $repo:String!) {
        repository(owner:$owner, name:$repo) {
            id

            discussionCategories(first: 100) {
                nodes {
                    id
                    name
                }
            }

            discussions(first: 100) {
                nodes {
                    id
                    body
                    title
                }
            }
        }
    }`,
};

const MUTATIONS = {
    CREATE_DISCUSSION: `mutation($input:CreateDiscussionInput!) {
        createDiscussion(input: $input) {
            discussion {
                id
            }
        }
    }`,
    UPDATE_DISCUSSION: `mutation($input:UpdateDiscussionInput!) {
        updateDiscussion(input: $input) {
            discussion {
                id
            }
        }
    }`,
};

module.exports = {
    QUERIES,
    MUTATIONS
};