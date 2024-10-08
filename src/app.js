import { string } from 'yup';
import axios from 'axios';
import * as i18n from 'i18next';
import { uniqueId } from 'lodash';
import watch from './view.js';
import resources from './locales/index.js';
import parseRSS from './parser.js';

const requestTimeout = 10000;
const newPostCheckInterval = 5000;
const newPostCheckTimeout = 10000;
const defaultLang = 'ru';

const makeReqLink = (link) => {
  const linkOrigin = new URL('https://allorigins.hexlet.app/get');
  linkOrigin.searchParams.set('disableCache', 'true');
  linkOrigin.searchParams.set('url', link);
  return linkOrigin;
};

const getErrorCode = (error) => {
  if (error.isAxiosError) {
    return 'networkErr';
  }
  if (error.isParserError) {
    return 'notRSS';
  }
  return 'unknownErr';
};

const makeAbortSignal = (timeoutValue) => ({ signal: AbortSignal.timeout(timeoutValue) });

const getData = (link, state) => axios
  .get(makeReqLink(link), makeAbortSignal(requestTimeout))
  .then((response) => {
    const { feedData, postsData } = parseRSS(response.data.contents);
    const feed = { ...feedData, id: uniqueId(), feedLink: link };
    const posts = postsData.map((post) => ({ ...post, id: uniqueId(), feedId: feed.id }));
    // eslint-disable-next-line no-param-reassign
    state.feeds = [feed, ...state.feeds];
    // eslint-disable-next-line no-param-reassign
    state.posts = [...posts, ...state.posts];
    // eslint-disable-next-line no-param-reassign
    state.loadingProcess = { status: 'success', error: null };
  })
  .catch((responseError) => {
    // eslint-disable-next-line no-param-reassign
    state.loadingProcess = {
      status: 'error',
      error: getErrorCode(responseError),
    };
  });

const updatePosts = (state) => {
  const promises = state.feeds.map((feed) => axios
    .get(makeReqLink(feed.feedLink), makeAbortSignal(newPostCheckTimeout))
    .then((response) => {
      const { postsData } = parseRSS(response.data.contents);
      const feedId = feed.id;
      const existingPostTitles = new Set(state.posts
        .filter((post) => post.feedId === feedId)
        .map((post) => post.title));
      const newPosts = postsData
        .filter(({ title }) => !existingPostTitles.has(title))
        .map((post) => ({ ...post, feedId, id: uniqueId() }));
      // eslint-disable-next-line no-param-reassign
      state.posts = [...newPosts, ...state.posts];
    })
    .catch(() => {}));

  Promise.all(promises)
    .finally(() => {
      setTimeout(() => updatePosts(state), newPostCheckInterval);
    });
};

const validate = (link, links) => {
  const schema = string()
    .url('notURL')
    .required('emptyField')
    .notOneOf(links, 'alreadyExists');
  return schema.validate(link)
    .then(() => null)
    .catch((error) => error);
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
        status: 'idle',
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
      watchedState.loadingProcess = { status: 'sending', error: null };

      validate(link, links)
        .then((error) => {
          if (error) {
            watchedState.loadingProcess = { status: 'idle', error: null };
            watchedState.form = { isValid: false, error: error.message };
            return;
          }
          watchedState.form = { isValid: true, error: null };
          getData(link, watchedState);
        });
    });

    elements.postsContainer.addEventListener('click', ({ target }) => {
      if (target.hasAttribute('data-id')) {
        watchedState.ui.seenPostsIds.add(target.dataset.id);
        watchedState.ui.activeModalId = target.dataset.id;
      }
    });

    updatePosts(watchedState);
  });
};

export default app;
