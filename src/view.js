import onChange from 'on-change';

const createPostButton = (id, t) => {
  const button = document.createElement('button');
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.setAttribute('type', 'button');
  button.setAttribute('data-id', id);
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');
  button.textContent = t('viewPostButton');
  return button;
};

const createPostLink = (url, id, title, feedId) => {
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('data-id', id);
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  link.setAttribute('id', feedId);
  link.classList.add('fw-bold');
  link.textContent = title;
  return link;
};

const createPostElems = (posts, t) => posts.map((post) => {
  const postCard = document.createElement('li');
  postCard.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  );
  const link = createPostLink(post.link, post.id, post.title, post.feedId);
  const button = createPostButton(post.id, t);
  postCard.append(link, button);

  return postCard;
});

const clearFeedback = (elems) => {
  const feedbackElemClasses = elems.feedback.classList;
  if (feedbackElemClasses.contains('text-danger')) {
    (feedbackElemClasses.remove('text-danger'));
  } else {
    (feedbackElemClasses.remove('text-success'));
  }
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

const renderNewPosts = (state, t, elements) => {
  const postUl = document.querySelector('div.posts ul');
  if (postUl) {
    const existingPostsIds = new Set([...elements.postsContainer.querySelectorAll('li a')]
      .map((postElem) => postElem.dataset.id));
    const newPostsData = state.posts
      .filter((post) => !existingPostsIds.has(post.id));
    const newPostElems = createPostElems(newPostsData, t);
    postUl.prepend(...newPostElems);
    renderSeenPosts(state);
  }
};

const renderModal = (state, activeId) => {
  const modalWindow = document.querySelector('.modal-dialog');
  const activePost = state.posts.find((post) => post.id === activeId);
  modalWindow.querySelector('.modal-title')
    .textContent = activePost.title;
  modalWindow.querySelector('.modal-body')
    .textContent = activePost.description;
};

const renderProcessError = (elems, error, t) => {
  const feedbackElem = elems.feedback;
  feedbackElem.classList.add('text-danger');
  feedbackElem.textContent = t(`loadingStates.${error}`);
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');
};

const renderFillingState = (error, elems, t) => {
  if (error) {
    renderProcessError(elems, error, t);
  }
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');
};

const renderFormError = (elems, error, t) => {
  const feedbackElem = elems.feedback;
  feedbackElem.classList.add('text-danger');
  feedbackElem.textContent = t(`formErrors.${error}`);
  elems.formInput.classList.add('is-invalid');
};

const renderFormValid = (elems) => {
  if (elems.formInput.classList.contains('is-invalid')) {
    elems.formInput.classList.remove('is-invalid');
  }
  const feedbackElem = elems.feedback;
  feedbackElem.textContent = '';
};

const renderSendingState = (elems) => {
  clearFeedback(elems);
  const { feedback } = elems;
  feedback.textContent = '';
  elems.formInput.setAttribute('readonly', true);
  elems.formSubmit.setAttribute('disabled', true);
};

const createFeedElem = (feed) => {
  const feedCard = document.createElement('li');
  feedCard.classList.add('list-group-item', 'border-0', 'border-end-0');
  const feedCardTitle = document.createElement('h3');
  feedCardTitle.classList.add('h6', 'm-0');
  feedCardTitle.textContent = feed.feedTitle;
  const feedCardDesc = document.createElement('p');
  feedCardDesc.classList.add('m-0', 'small', 'text-black-50');
  feedCardDesc.textContent = feed.description;

  feedCard.append(feedCardTitle, feedCardDesc);
  return feedCard;
};

const createFeeds = (state, elems, t) => {
  const { feedsContainer } = elems;
  feedsContainer.innerHTML = '';
  const feedHolder = document.createElement('div');
  feedHolder.classList.add('card', 'border-0');

  const feedTitleBox = document.createElement('div');
  feedTitleBox.classList.add('card-body');
  const feedTitle = document.createElement('h2');
  feedTitle.classList.add('card-title', 'h4');
  feedTitle.textContent = t('feedsTitle');
  feedTitleBox.append(feedTitle);

  const feedsUl = document.createElement('ul');
  feedsUl.classList.add('list-group', 'border-0', 'rounded-0');
  const feeds = state.feeds.map(createFeedElem);
  feedsUl.append(...feeds);
  feedHolder.append(feedTitleBox, feedsUl);
  return feedHolder;
};

const createPostList = (postElems, t) => {
  const postHolder = document.createElement('div');
  postHolder.classList.add('card', 'border-0');

  const postTitleBox = document.createElement('div');
  postTitleBox.classList.add('card-body');

  const postTitle = document.createElement('h2');
  postTitle.classList.add('card-title', 'h4');
  postTitle.textContent = t('postsTitle');
  postTitleBox.append(postTitle);

  const postUl = document.createElement('ul');
  postUl.classList.add('list-group', 'border-0', 'rounded-0');

  postUl.append(...postElems);
  postHolder.append(postTitleBox, postUl);
  return postHolder;
};

const renderFinishedState = (elems, state, t) => {
  const feedbackElem = elems.feedback;
  feedbackElem.classList.add('text-success');
  feedbackElem.textContent = t('loadingStates.finished');
  elems.formSubmit.removeAttribute('disabled');
  const { formInput } = elems;
  formInput.removeAttribute('readonly');
  formInput.value = '';

  const postsElems = createPostElems(state.posts, t);
  const postHolder = createPostList(postsElems, t);
  const { postsContainer } = elems;
  postsContainer.innerHTML = '';
  postsContainer.append(postHolder);
  renderSeenPosts(state);

  const feedHolder = createFeeds(state, elems, t);
  elems.feedsContainer.append(feedHolder);
};

const handleForm = (elems, value, t) => {
  if (!value.isValid) {
    renderFormError(elems, value.error, t);
  } else {
    renderFormValid(elems);
  }
};

const handleLoadingState = (value, elems, state, t) => {
  switch (value.state) {
    case 'sending':
      renderSendingState(elems);
      break;
    case 'finished':
      renderFinishedState(elems, state, t);
      break;
    case 'filling':
      renderFillingState(value.error, elems, t);
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
        handleLoadingState(value, elements, state, t);
        break;
      case 'posts':
        renderNewPosts(state, t, elements);
        break;
      case 'ui.seenPostsIds':
        renderSeenPosts(state);
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
