import axios from 'axios';

export default (token = null, history = null) => {
  const baseURL = process.env.REACT_APP_CMS_GRAPHQL_API;
  // const baseURL = process.env.REACT_APP_IMS_GRAPHQL_API;

  let headers: any = {};
  //headers.ContentType = 'application/json';

  // if (token) {
  //   headers.Authorization = `${token}`;
  // }

  const axiosInstance = axios.create({
    baseURL: baseURL,
    headers,
  });

  axiosInstance.defaults.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  axiosInstance.interceptors.response.use(
    (response) =>
      new Promise((resolve, reject) => {
        resolve(response);
      }),
    (error) => {
      if (!error.response) {
        return new Promise((resolve, reject) => {
          reject(error);
        });
      }

      if (error.response.status === 403) {
        //localStorage.removeItem('token');

        if (history) {
          //history.push('/auth/login');
        } else {
          //window.location = '/auth/login';
        }
      } else {
        return new Promise((resolve, reject) => {
          reject(error);
        });
      }
    }
  );

  return axiosInstance;
};
