import onChange from 'on-change';

const handleFormError = (elems, prevError, newError) => {
  elems.feedback.classList.add('text-danger');
  if (!prevError && newError) {
    elems.feedback.textContent = newError;
    return;
  }
  if (prevError && newError) {
    elems.feedback.textContent = newError;
    return;
  }
  if (prevError && !newError) {
    elems.feedback.textContent = '';
  }
};

const handleSending = (elems) => {
  clearFeedback(elems);
  elems.feedback.textContent = '';
  elems.formInput.setAttribute('readonly', true);
  elems.formSubmit.setAttribute('disabled', true);
};

const handleFinished = (elems) => {
  elems.feedback.classList.add('text-success');
  document.querySelector('p.feedback').classList.add('text-success');
  elems.feedback.textContent = 'Success';
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');
};

const handleProcessError = (elems, error) => {
  elems.feedback.classList.add('text-danger');
  elems.feedback.textContent = error;
  elems.formInput.removeAttribute('readonly');
  elems.formSubmit.removeAttribute('disabled');
};

const clearFeedback = (elems) => {
  console.log(elems.feedback);
  elems.feedback.classList.contains('text-danger')
    ? elems.feedback.classList.remove('text-danger')
    : elems.feedback.classList.remove('text-success');
};

const watch = (state, elements) => {
  const watchedState = onChange(state, (path, value, prevValue) => {
    switch (path) {
      case 'form':
        if (value.error) {
          handleFormError(elements, prevValue.error, value.error);
        }
        break;
      case 'loadingProcess':
        switch (value.state) {
          case 'sending':
            handleSending(elements);
            break;
          case 'finished':
            handleFinished(elements);
            break;
          case 'filling':
            if (value.error) {
              handleProcessError(elements, value.error);
            }
            elements.formInput.removeAttribute('readonly');
            elements.formSubmit.removeAttribute('disabled');
          default:
            break;
        }
        break;
      case 'posts':
        //render posts from updatePosts function
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default watch;
