import './styles.scss';
import 'bootstrap';
import { string } from 'yup';
import axios from 'axios';
import * as i18n from 'i18next';
import watch from './view.js';
import ru from './locales/ru.js';
import { uniqueId } from 'lodash';

// const timeout = 5000;
// validate the input as rss link function
const linkOrigin = 'https://allorigins.hexlet.app/get?disableCache=true&url=';
// TO DO
/* const updateContent = (state) => {
  //make an axios request
}; */
const parseXML = (xmlData) => {
  const parser = new DOMParser;
  return parser.parseFromString(xmlData, "text/xml");
};

const getData = (url) => {
  return axios.get(linkOrigin + String(url))
    .then((response) => parseXML(response.data.contents))
    .then((parsedDoc) => {
      const feed = {
        feedTitle: parsedDoc.querySelector('title').textContent,
        description: parsedDoc.querySelector('description').textContent,
        id: uniqueId(),
      };
      const posts = [...parsedDoc.querySelectorAll('item')]
        .map((post) => ({
          title: post.querySelector('title').textContent,
          description: post.querySelector('description').textContent,
          link: post.querySelector('link').textContent,
          id: uniqueId(),
          feedId: feed.id,
        }));
      return { feed, posts };
    })
    .catch(() => {
      return null;
    });  
};

const validate = (link, links) => {
  const schema = string()
    .url('notURL') // Must be a url
    .required('mustNotBeEmpty') // Not empty
    .notOneOf(links, 'alreadyExists'); // Must not be in array

  return schema.validate(link)
    .then(() => null)
    .catch((e) => e.message);
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
      errorHolder: document.querySelector('p.feedback.text-danger'),
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
    // const watchedState = onChange(initialState, view(initialState, elements));

    // Add event listener to submit
    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('url').trim();
      const links = watchedState.feeds;
      watchedState.loadingProcess = { state: 'sending', error: null }; //lock the button and input

      validate(url, links)
        .then((error) => {
          if (error) {
            watchedState.form = { isValid: false, error };
          } else {
            getData(url)
              .then((data) => {
                if (data) {
                  const { feed, posts } = data;
                  watchedState.feeds.push(feed);
                  watchedState.posts.push(...posts);
                  watchedState.loadingProcess = { state: 'finished', error: null }; // make the contents and feed render
                  watchedState.form = { isValid: true, error: null };
                } else {
                  watchedState.loadingProcess = { state: 'filling', error: 'Network error' };
                }
              });
          }
        })
    });
  });
};

export default app;
