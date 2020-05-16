let messageContainer = document.getElementById("message-container");
let ws = new WebSocket("ws://" + window.location.host);

ws.addEventListener('open', initialize);
ws.addEventListener('message', acceptMessage);
ws.addEventListener('close', () => {
  console.log("Connection closed.");
});
ws.addEventListener('error', handleError);

document.querySelector('form')
  .addEventListener('submit', sendMessage);

function initialize() {
  console.log("Connection is open.");
}

function acceptMessage(event) {
  console.log("Got a message");
  let {createdAt, author, text} = JSON.parse(event.data);
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
function sendMessage(event) {
  event.preventDefault();

  let form = event.target;
  let items = form.elements;
  let messageData = { text: items.text.value };

  form.reset();
  ws.send(JSON.stringify(messageData));
}

function handleError(error) {
  console.error(error);
}
