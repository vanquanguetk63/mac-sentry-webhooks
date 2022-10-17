

const instance = axios.create({
  baseURL: MOMO_SENTRY_SERVRER,
  timeout: 1000,
  headers: {
    Authorization:
      "Bearer f36b22a3e71c4f8e9e5a76fa24e6b5a2a290eedf494d4d4aac818ddd7c4d0ed4",
  },
});

instance.defaults.headers.common["Authorization"] = SENTRY_TOKEN;

const get = (url, data) => {
  return instance
    .get(url, {
      params: data,
    })
    .then((response) => response.data)
    .catch((error) => error);
};

const getAuthentication = async (url, data) => {
  const token = await getItemAsync("DEEM_ACCESS_TOKEN");
  return instance
    .get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { ...data },
    })
    .then((response) => response.data)
    .catch((error) => error);
};

const post = (url, data) => {
  return instance
    .post(url, data)
    .then((response) => {
      return response.data;
    })
    .catch((error) => error);
};

const put = (url, data) => {
  return instance
    .put(url, data)
    .then((response) => response.data)
    .catch((error) => error);
};

const del = (url) => {
  return instance
    .delete(url)
    .then((response) => response.data)
    .catch((error) => error);
};

const api = {
  get,
  getAuthentication,
  post,
  put,
  del,
};

module.exports.api = api;
