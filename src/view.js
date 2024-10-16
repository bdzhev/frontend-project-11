import onChange from 'on-change';

const createPostButton = (id, t) => {
  const button = document.createElement('button');
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.setAttribute('type', 'button');
  button.dataset.id = id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#modal';
  button.textContent = t('viewPostButton');
  return button;
};

const createPostLink = (url, id, title, feedId) => {
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.dataset.id = id;
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  link.setAttribute('id', feedId);
  link.classList.add('fw-bold');
  link.textContent = title;
  return link;
};

const createPosts = (posts, t) => posts.map((postData) => {
  const post = document.createElement('li');
  post.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  );
  const link = createPostLink(postData.link, postData.id, postData.title, postData.feedId);
  const button = createPostButton(postData.id, t);
  post.append(link, button);

  return post;
});

const createPostList = (posts, t) => {
  const postList = document.createElement('div');
  postList.classList.add('card', 'border-0');

  const postTitleBox = document.createElement('div');
  postTitleBox.classList.add('card-body');

  const postTitle = document.createElement('h2');
  postTitle.classList.add('card-title', 'h4');
  postTitle.textContent = t('postsTitle');
  postTitleBox.append(postTitle);

  const postUl = document.createElement('ul');
  postUl.classList.add('list-group', 'border-0', 'rounded-0');

  postUl.append(...posts);
  postList.append(postTitleBox, postUl);
  return postList;
};

const clearFeedback = (elements) => {
  const feedbackClasses = elements.feedback.classList;
  feedbackClasses.remove('text-success', 'text-danger');
};

const renderSeenPosts = (state) => {
  state.ui.seenPostsIds.forEach((id) => {
    const postLink = document.querySelector(`li a[data-id="${id}"]`);
    if (postLink.classList.contains('fw-bold')) {
      postLink.classList.remove('fw-bold');
      postLink.classList.add('link-secondary', 'fw-normal');
    }
  });
};

const renderPosts = (state, elements, t) => {
  const { postsContainer } = elements;
  postsContainer.innerHTML = '';
  const posts = createPosts(state.posts, t);
  const postList = createPostList(posts, t);
  postsContainer.append(postList);
  renderSeenPosts(state);
};

const createFeed = (feedData) => {
  const feed = document.createElement('li');
  feed.classList.add('list-group-item', 'border-0', 'border-end-0');
  const feedTitle = document.createElement('h3');
  feedTitle.classList.add('h6', 'm-0');
  feedTitle.textContent = feedData.feedTitle;
  const feedDesc = document.createElement('p');
  feedDesc.classList.add('m-0', 'small', 'text-black-50');
  feedDesc.textContent = feedData.description;

  feed.append(feedTitle, feedDesc);
  return feed;
};

const createFeedList = (state, t) => {
  const feedList = document.createElement('div');
  feedList.classList.add('card', 'border-0');

  const feedTitleBox = document.createElement('div');
  feedTitleBox.classList.add('card-body');
  const feedTitle = document.createElement('h2');
  feedTitle.classList.add('card-title', 'h4');
  feedTitle.textContent = t('feedsTitle');
  feedTitleBox.append(feedTitle);

  const feedsUl = document.createElement('ul');
  feedsUl.classList.add('list-group', 'border-0', 'rounded-0');
  const feeds = state.feeds.map(createFeed);
  feedsUl.append(...feeds);
  feedList.append(feedTitleBox, feedsUl);
  return feedList;
};

const renderFeeds = (state, elements, t) => {
  const { feedsContainer } = elements;
  feedsContainer.innerHTML = '';
  const feedList = createFeedList(state, t);
  feedsContainer.append(feedList);
};

const renderModal = (state, activeId) => {
  const modalWindow = document.querySelector('.modal-dialog');
  const activePost = state.posts.find((post) => post.id === activeId);
  modalWindow.querySelector('.modal-title')
    .textContent = activePost.title;
  modalWindow.querySelector('.modal-body')
    .textContent = activePost.description;
};

const activateForm = (elements) => {
  const { formInput, formSubmit } = elements;
  formInput.removeAttribute('readonly');
  formInput.removeAttribute('disabled');
  formSubmit.removeAttribute('disabled');
};

const renderErrorStatus = (error, elements, t) => {
  const { feedback } = elements;
  feedback.classList.add('text-danger');
  feedback.textContent = t(`loadingStates.${error}`);
  activateForm(elements);
};

const renderFormError = (elements, error, t) => {
  const { feedback } = elements;
  feedback.classList.add('text-danger');
  feedback.textContent = t(`formErrors.${error}`);
  elements.formInput.classList.add('is-invalid');
};

const renderFormValid = (elements) => {
  const formInputClasses = elements.formInput.classList;
  formInputClasses.remove('is-invalid');
  const { feedback } = elements;
  feedback.textContent = '';
};

const renderSendingStatus = (elements) => {
  clearFeedback(elements);
  const { feedback } = elements;
  feedback.textContent = '';
  const { formInput } = elements;
  formInput.setAttribute('readonly', true);
  formInput.setAttribute('disabled', true);
};

const renderSuccessStatus = (elements, t) => {
  const { feedback, formInput } = elements;
  feedback.classList.add('text-success');
  feedback.textContent = t('loadingStates.success');
  activateForm(elements);
  formInput.value = '';
};

const handleForm = (elements, value, t) => {
  if (value.isValid) {
    renderFormValid(elements);
  } else {
    renderFormError(elements, value.error, t);
  }
};

const handleLoadingState = (value, elements, t) => {
  switch (value.status) {
    case 'sending':
      renderSendingStatus(elements);
      break;
    case 'success':
      renderSuccessStatus(elements, t);
      break;
    case 'idle':
      activateForm(elements);
      break;
    case 'error':
      renderErrorStatus(value.error, elements, t);
      break;
    default:
      break;
  }
};

const watch = (state, elements, { t }) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form':
        handleForm(elements, value, t);
        break;
      case 'loadingProcess':
        handleLoadingState(value, elements, t);
        break;
      case 'feeds':
        renderFeeds(state, elements, t);
        break;
      case 'posts':
      case 'ui.seenPostsIds':
        renderPosts(state, elements, t);
        break;
      case 'ui.activeModalId':
        renderModal(state, value);
        break;
      default:
        break;
    }
  });
  return watchedState;
};

export default watch;
