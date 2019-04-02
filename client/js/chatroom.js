let messageContainer = document.getElementById("message-container")
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
  let chatID = +document.getElementById('chatID').value;
  let userID = +document.getElementById('userID').value;
  let initData = {chatID, userID, isInit:true};
  ws.send(JSON.stringify(initData));
}
function acceptMessage(event) {
  console.log("Got a message");
  let {date, author, text} = JSON.parse(event.data);
  let messageRow = document.createElement('li');
  if (author.length >= 13) {
    author = author.slice(0, 13) + "...";
  }
  const messageParts = {date, author, text}
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
  let messageData = {
    chatID: +items.chatID.value, // WARNING: Client-side data control
    userID: +items.userID.value, //   is insecure!
    isInit: false,
    content: {
      author:items.author.value,
      text:items.text.value,
    }
  };
  form.reset();
  ws.send(JSON.stringify(messageData));
}

function handleError(error) {
  console.error(error);
}
