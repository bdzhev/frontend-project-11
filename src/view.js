const handleFormError = (elements, prevError, newError) => {
  if (!prevError && newError) {
    const errorText = document.createElement('p');
    errorText.textContent = newError;
    errorText.classList.add('feedback', 'm-0', 'position-absolute', 'small', 'text-danger');
    elements.form.append(errorText);
    return;
  }
  if (prevError && newError) {
    elements.form.lastChild.textContent = newError;
    return;
  }
  if (prevError && !newError) {
    elements.form.lastChild.remove();
  }
};

const view = (state, elements) => (path, oldValue, newValue) => {
  switch (path) {
    case 'processState.error':
      if (!state.processState.error) {
        handleFormError(elements, oldValue, newValue);
        // render error
      }
      break;
    default:
      throw new Error(`Unknown value <${newValue}> assignment to [${path}]`);
  }
};

export default view;
