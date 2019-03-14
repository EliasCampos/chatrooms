let messageContainer = document.getElementById("message-container")
let ws = new WebSocket("ws://localhost:3000");

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
  let content = JSON.parse(event.data);
  let messageRow = document.createElement('li');
  if (content.author.length >= 13) {
    let author = content.author
    content.author = author.slice(0, 13) + "...";
  }
  for (let item in content) {
    let node = document.createElement('span');
    node.className = `msg-${item}`;
    node.textContent = ""+content[item];
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
    chatID: +items.chatID.value,
    userID: +items.userID.value,
    isInit: false,
    content: {
      date:getDateTime(),
      author:items.author.value,
      text:items.text.value,
    }
  };
  form.reset();
  ws.send(JSON.stringify(messageData));
}

const prettyDec = num => num > 9 ? ""+num : "0"+num ;
function getDateTime() {
  let date = new Date();
  let year = date.getFullYear();
  let month = prettyDec(date.getMonth());
  let day = prettyDec(date.getDate());
  let hours = prettyDec(date.getHours());
  let minutes = prettyDec(date.getMinutes());
  let seconds = prettyDec(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function handleError(error) {
  console.error(error);
}
