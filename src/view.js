import onChange from 'on-change';

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

  const link = document.createElement('a');
  link.setAttribute('href', post.link);
  link.setAttribute('data-id', post.id);
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  link.classList.add('fw-bold');
  link.textContent = post.title;
  postCard.append(link);

  const button = document.createElement('button');
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.setAttribute('type', 'button');
  button.setAttribute('data-id', post.id);
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#modal');
  button.textContent = t('viewPostButton');
  postCard.append(button);

  return postCard;
});

const clearFeedback = (elems) => {
  elems.feedback.classList.contains('text-danger')
    ? elems.feedback.classList.remove('text-danger')
    : elems.feedback.classList.remove('text-success');
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

const handleModal = (state, activeId) => {
  const modalWindow = document.querySelector('.modal-dialog');
  const activePost = state.posts.find((post) => post.id === activeId);
  modalWindow.querySelector('.modal-title')
    .textContent = activePost.title;
  modalWindow.querySelector('.modal-body')
    .textContent = activePost.description;
};

const handleProcessError = (elems, error, t) => {
  elems.feedback.classList.add('text-danger');
  elems.feedback.textContent = t(`loadingStates.${error}`);
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');
};

const handleFilling = (error, elems, t) => {
  if (error) {
    handleProcessError(elems, error, t);
  }
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');
};

const handleFormError = (elems, error, t) => {
  elems.feedback.classList.add('text-danger');
  elems.formInput.classList.add('is-invalid');
  elems.feedback.textContent = t(`formErrors.${error}`);
};

const handleFormValid = (elems) => {
  if (elems.formInput.classList.contains('is-invalid')) {
    elems.formInput.classList.remove('is-invalid');
  }
  elems.feedback.textContent = '';
};

const handleSending = (elems) => {
  clearFeedback(elems);
  elems.feedback.textContent = '';
  elems.formInput.setAttribute('readonly', true);
  elems.formSubmit.setAttribute('disabled', true);
};

const handleFinished = (elems, state, t) => {
  elems.feedback.classList.add('text-success');
  elems.feedback.textContent = t('loadingStates.finished');
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');

  elems.postsContainer.innerHTML = '';
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

  const posts = createPostElems(state.posts, t);

  postUl.append(...posts);
  postHolder.append(postTitleBox, postUl);
  elems.postsContainer.append(postHolder);
  renderSeenPosts(state);

  elems.feedsContainer.innerHTML = '';
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
  const feeds = state.feeds.map((feed) => {
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
  });
  feedsUl.append(...feeds);

  feedHolder.append(feedTitleBox, feedsUl);
  elems.feedsContainer.append(feedHolder);
};

const watch = (state, elements, { t }) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form':
        if (!value.isValid) {
          handleFormError(elements, value.error, t);
        } else {
          handleFormValid(elements);
        }
        break;
      case 'loadingProcess':
        switch (value.state) {
          case 'sending':
            handleSending(elements);
            break;
          case 'finished':
            handleFinished(elements, state, t);
            break;
          case 'filling':
            handleFilling(value.error, elements, t);
            break;
          default:
            break;
        }
        break;
      case 'posts':
        renderNewPosts(state, t, elements);
        break;
      case 'ui.seenPostsIds':
        renderSeenPosts(state);
        break;
      case 'ui.activeModalId':
        handleModal(state, value);
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default watch;
