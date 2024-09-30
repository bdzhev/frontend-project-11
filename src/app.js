import { string } from 'yup';
import axios from 'axios';
import * as i18n from 'i18next';
import { uniqueId } from 'lodash';
import watch from './view.js';
import resources from './locales/index.js';
import parseXML from './parser.js';

const requestTimeout = 10000;
const updateInterval = 5000;
const defaultLang = 'ru';

const makeReqLink = (link) => {
  const linkOrigin = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
  return (linkOrigin + String(link));
};

const makePost = (post, feedId) => ({
  title: post.querySelector('title').textContent,
  description: post.querySelector('description').textContent,
  link: post.querySelector('link').textContent,
  id: uniqueId(),
  feedId,
});

const getData = (url) => axios
  .get(makeReqLink(url), { signal: AbortSignal.timeout(requestTimeout) })
  .then((response) => parseXML(response.data.contents))
  .then((doc) => {
    const feed = {
      feedTitle: doc.querySelector('title').textContent,
      description: doc.querySelector('description').textContent,
      feedLink: url,
      id: uniqueId(),
    };
    const posts = [...doc.querySelectorAll('item')]
      .map((post) => makePost(post, feed.id));
    return { feed, posts };
  });

const validate = (link, links) => {
  const schema = string()
    .url('notURL')
    .required('emptyField')
    .notOneOf(links, 'alreadyExists');
  return schema.validate(link);
};

const app = () => {
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: defaultLang,
    debug: true,
    resources,
  }).then(() => {
    const elements = {
      form: document.querySelector('form'),
      formSubmit: document.querySelector('button[type="submit"]'),
      feedback: document.querySelector('p.feedback'),
      formInput: document.querySelector('#url-input'),
      postsContainer: document.querySelector('div.posts'),
      feedsContainer: document.querySelector('div.feeds'),
      modalHeader: document.querySelector('.modal-header'),
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
        seenPostsIds: new Set(),
        activeModalId: null,
      },
    };

    const watchedState = watch(initialState, elements, i18nInstance);

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
          watchedState.feeds.unshift(feed);
          watchedState.posts.unshift(...posts);
          watchedState.form = { isValid: true, error: null };
          watchedState.loadingProcess = { state: 'finished', error: null };
        })
        .catch((err) => {
          if (err.response || err.message === 'canceled' || err.message === 'Network Error') {
            watchedState.loadingProcess = { state: 'filling', error: 'networkErr' };
          } else {
            watchedState.form = { isValid: false, error: err.message };
            watchedState.loadingProcess = { state: 'filling', error: null };
          }
        });
    });

    elements.postsContainer.addEventListener('click', ({ target }) => {
      if (target.tagName === 'A') {
        watchedState.ui.seenPostsIds.add(target.dataset.id);
      }
      if (target.tagName === 'BUTTON') {
        watchedState.ui.seenPostsIds.add(target.dataset.id);
        watchedState.ui.activeModalId = target.dataset.id;
      }
    });

    const updatePosts = (state) => {
      const promises = state.feeds.map((feed) => axios
        .get(makeReqLink(feed.feedLink))
        .then((response) => parseXML(response.data.contents))
        .then((doc) => {
          const curId = feed.id;
          const responsePosts = [...doc.querySelectorAll('item')];
          const existingPostTitles = new Set(state.posts
            .filter((post) => post.feedId === curId)
            .map((post) => post.title));
          if (responsePosts.length !== 0) {
            const filteredPosts = responsePosts
              .filter((liElem) => !existingPostTitles
                .has(liElem.querySelector('title').textContent));
            const newPosts = filteredPosts
              .map((post) => makePost(post, feed.id));
            state.posts.unshift(...newPosts);
          }
        })
        .catch((err) => {
          throw err;
        }));

      Promise.all(promises)
        .finally(() => {
          setTimeout(() => updatePosts(state), updateInterval);
        });
    };
    updatePosts(watchedState);
  });
};

export default app;
