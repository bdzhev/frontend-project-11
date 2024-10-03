import { string } from 'yup';
import axios from 'axios';
import * as i18n from 'i18next';
import { uniqueId } from 'lodash';
import watch from './view.js';
import resources from './locales/index.js';
import parseRSS from './parser.js';

const requestTimeout = 10000;
const newPostCheckInterval = 5000;
const defaultLang = 'ru';

const makeReqLink = (link) => {
  const linkOrigin = new URL('https://allorigins.hexlet.app/get');
  linkOrigin.searchParams.set('disableCache', 'true');
  linkOrigin.searchParams.set('url', link);
  return linkOrigin;
};

const getData = (link) => axios
  .get(makeReqLink(link), { signal: AbortSignal.timeout(requestTimeout) })
  .then((response) => parseRSS(response.data.contents))
  .then(({ feedData, postsData }) => {
    const feed = { ...feedData, id: uniqueId(), feedLink: link };
    const posts = postsData.map((post) => ({ ...post, id: uniqueId(), feedId: feed.id }));
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
      const link = formData.get('url').trim();
      const links = watchedState.feeds.map((feed) => feed.feedLink);
      watchedState.loadingProcess = { state: 'sending', error: null };

      validate(link, links)
        .then(() => getData(link))
        .then((data) => {
          const { feed, posts } = data;
          watchedState.feeds.unshift(feed);
          watchedState.posts.unshift(...posts);
          watchedState.form = { isValid: true, error: null };
          watchedState.loadingProcess = { state: 'finished', error: null };
        })
        .catch((error) => {
          if (error.isAxiosError) {
            watchedState.loadingProcess = { state: 'filling', error: 'networkErr' };
          } else {
            watchedState.form = { isValid: false, error: error.message };
            watchedState.loadingProcess = { state: 'filling', error: null };
          }
        });
    });

    elements.postsContainer.addEventListener('click', ({ target }) => {
      watchedState.ui.seenPostsIds.add(target.dataset.id);
      watchedState.ui.activeModalId = target.dataset.id;
    });

    const updatePosts = (state) => {
      const promises = state.feeds.map((feed) => axios
        .get(makeReqLink(feed.feedLink))
        .then((response) => parseRSS(response.data.contents))
        .then(({ postsData }) => {
          const feedId = feed.id;
          const existingPostTitles = new Set(state.posts
            .filter((post) => post.feedId === feedId)
            .map((post) => post.title));
          const newPosts = postsData
            .filter(({ title }) => !existingPostTitles.has(title))
            .map((post) => ({ ...post, feedId, id: uniqueId() }));
          state.posts.unshift(...newPosts);
        })
        .catch((error) => {
          throw error;
        }));

      Promise.all(promises)
        .finally(() => {
          setTimeout(() => updatePosts(state), newPostCheckInterval);
        });
    };
    updatePosts(watchedState);
  });
};

export default app;
