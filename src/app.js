import './styles.scss';
import 'bootstrap';
import { string } from 'yup';
import axios from 'axios';
import * as i18n from 'i18next';
import watch from './view.js';
import ru from './locales/ru.js';
import { uniqueId } from 'lodash';
import { parseXML } from '../utils.js';

const timeoutValue = 10000;
const linkOrigin = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
// TO DO
/* const updateContent = (state) => {
}; */

const getData = (url) => {
  return axios.get(linkOrigin + String(url), { signal: AbortSignal.timeout(timeoutValue) })
    .then((response) => parseXML(response.data.contents))
    .then((doc) => {
      const feed = {
        feedTitle: doc.querySelector('title').textContent,
        description: doc.querySelector('description').textContent,
        feedLink: url,
        id: uniqueId(),
      };
      const posts = [...doc.querySelectorAll('item')]
        .map((post) => ({
          title: post.querySelector('title').textContent,
          description: post.querySelector('description').textContent,
          link: post.querySelector('link').textContent,
          id: uniqueId(),
          feedId: feed.id,
        }));
      return { feed, posts };
    });  
};

const validate = (link, links) => {
  const schema = string()
    .url('notURL')
    .required()
    .notOneOf(links, 'alreadyExists');
  return schema.validate(link);
};

const app = () => {
  // Init the app
  const defaultLang = 'ru';
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: defaultLang,
    debug: true,
    resources: { ru },
  }).then(() => {
    const elements = {
      form: document.querySelector('form'),
      formSubmit: document.querySelector('button[type="submit"]'),
      feedback: document.querySelector('p.feedback'),
      formInput: document.querySelector('#url-input'),
    };

    const initialState = {
      loadingProcess: {
        state: 'loading',
        error: null,
      },
      form: {
        isValid: true,
        error: null,
      },
      feeds: [],
      posts: [],
      ui: {
        seenPostsIds: [], // save posts id
      }
    };
    const watchedState = watch(initialState, elements);

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url').trim();
      const links = watchedState.feeds.map((feed) => feed.feedLink);
      watchedState.loadingProcess = { state: 'sending', error: null };

      validate(url, links)
        .then(() => getData(url))
        .then((data) => {
          const { feed, posts } = data;
          watchedState.feeds.push(feed);
          watchedState.posts.push(...posts);
          watchedState.loadingProcess = { state: 'finished', error: null };
          watchedState.form = { isValid: true, error: null };
          console.log(watchedState);
        })
        .catch((err) => {
          if (err.reponse || err.message === 'canceled') {
            watchedState.loadingProcess = { state: 'filling', error: 'networkErr'};
          } else if (err.message === 'notRSS') {
            watchedState.loadingProcess = { state: 'filling', error: err.message };
          } else {
            watchedState.loadingProcess = { state: 'filling', error: null };
            watchedState.form = { isValid: false, error: err.message };
          }
        })
    });
  });
};

export default app;
