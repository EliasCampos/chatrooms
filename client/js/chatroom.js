let messageContainer = document.getElementById("message-container");
let ws = new WebSocket("ws://" + window.location.host);

ws.addEventListener('open', initialize);
ws.addEventListener('message', acceptMessage);
ws.addEventListener('close', () => {
  console.log("Connection closed.");
});
ws.addEventListener('error', handleError);

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('msg-error').style.display = 'none';
  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(e.target);
  });

  let isEnterPressed = false;

  form.text.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isEnterPressed && form.text.value.length > 0) {
        isEnterPressed = true;
        sendMessage(form);
      }
    }
  });
  form.text.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && isEnterPressed) {
      isEnterPressed = false;
    }
  })
});

function initialize() {
  console.log("Connection is open.");
}

function acceptMessage(event) {
  console.log("Got a message");
  let {error, message} = JSON.parse(event.data);
  let errorDisplayElement = document.getElementById('msg-error');
  if (error) {
    errorDisplayElement.style.display = 'inline';
    errorDisplayElement.innerText = error;
    return;
  }
  errorDisplayElement.style.display = 'none';

  let {createdAt, author, text} = message;
  let messageRow = document.createElement('li');
  let username = author.username.length > 13 ? `${author.username.slice(0, 13)}...` : author.username;
  const messageParts = {date: createdAt, author: username, text};
  for (let item in messageParts) {
    let node = document.createElement('span');
    node.className = `msg-${item}`;
    node.textContent = ""+messageParts[item];
    messageRow.appendChild(node);
  }

  messageContainer
    .insertBefore(messageRow, messageContainer.firstChild);
}
function sendMessage(form) {
  let messageData = { text: form.text.value };
  form.reset();
  ws.send(JSON.stringify(messageData));
}

function handleError(error) {
  console.error(error);
}
