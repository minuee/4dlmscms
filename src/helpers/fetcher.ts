const GRAPHQL_ENDPOINT = 'https://test-cms-api.4dreplay.io/cms/v0/gql/user';
const headers = { 'Content-Type': 'application/json' };
const _fetch = async (...args) => {
  const options = {
    headers: headers,
    method: 'POST',
    body: JSON.stringify(args[0]),
  };
  const res = await fetch(GRAPHQL_ENDPOINT, options);
  const res_json = await res.json();
  if (res_json.errors) {
    throw JSON.stringify(res_json.errors);
  }
  return res_json.data;
};

export default _fetch;
