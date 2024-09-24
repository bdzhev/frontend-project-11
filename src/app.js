import './styles.scss';
import 'bootstrap';
import { string } from 'yup';
import onChange from 'on-change';
// import axios from 'axios';
import * as i18n from 'i18next';
import view from './view.js';
import ru from './locales/ru.js';

// const timeout = 5000;
// validate the input as rss link function

// TO DO
/* const updateContent = (state) => {
  //make an axios request
}; */

const validate = (link, links) => {
  const schema = string()
    .url('notURL') // Must be a url
    .required('mustNotBeEmpty') // Not empty
    .notOneOf(links, 'alreadyExsts'); // Must not be in array
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
    };

    const initialState = {
      processState: {
        state: 'filling',
        error: null,
      },
      content: {
        feeds: [],
        posts: [],
      },
    };

    const state = onChange(initialState, view(initialState, elements));

    // Add event listener to submit
    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      // const formData = new FormData(e.target);
      // const url = formData.get('url').trim();
      // form an array from feeds
      const links = state.feeds;

      validate(links)
        .then(() => {
          state.processState.state = 'sending';
          state.processState.error = null;
        })
        .catch((err) => {
          state.processState.error = err.message;
          console.log(state);
        });
    });
  });
};

export default app;
