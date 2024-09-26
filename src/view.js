import onChange from 'on-change';

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

const handleFormError = (elems, error) => {
  elems.feedback.classList.add('text-danger');
  elems.formInput.classList.add('is-invalid');
  elems.feedback.textContent = error;
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

const handleFinished = (elems, state) => {
  elems.feedback.classList.add('text-success');
  document.querySelector('p.feedback').classList.add('text-success');
  elems.feedback.textContent = 'Success';
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');

  elems.postsContainer.innerHTML = '';
  const postHolder = document.createElement('div');
  postHolder.classList.add('card', 'border-0');

  const postTitleBox = document.createElement('div');
  postTitleBox.classList.add('card-body');

  const postTitle = document.createElement('h2');
  postTitle.classList.add('card-title', 'h4');
  postTitle.textContent = 'Посты'; // add i18
  postTitleBox.append(postTitle);

  const postUl = document.createElement('ul');
  postUl.classList.add('list-group', 'border-0', 'rounded-0');

  const posts = state.posts.map((post) => {
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
    button.textContent = 'Просмотр'; // i18n
    postCard.append(button);

    return postCard;
  });
  postUl.append(...posts);
  postHolder.append(postTitleBox, postUl);
  elems.postsContainer.append(postHolder);
  renderSeenPosts(state);
  // create feedblocks
};

const handleProcessError = (elems, error) => {
  elems.feedback.classList.add('text-danger');
  elems.feedback.textContent = error;
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');
};

const watch = (state, elements) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form':
        if (!value.isValid) {
          handleFormError(elements, value.error);
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
            handleFinished(elements, state);
            break;
          case 'filling':
            if (value.error) {
              handleProcessError(elements, value.error);
            }
            elements.formInput.removeAttribute('readonly');
            elements.formSubmit.removeAttribute('disabled');
            break;
          default:
            break;
        }
        break;
      case 'posts':
        // render posts from updatePosts function
        break;
      case 'ui.seenPostsIds':
        renderSeenPosts(state);
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default watch;
