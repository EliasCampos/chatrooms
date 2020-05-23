const GET_PARAMS = {
  method:'GET',
  cors:'no-cors',
  credentials:'same-origin'
};

const CHAT_UPDATE_INTERVAL = 10 * 1000; // each 10 seconds

document.addEventListener('DOMContentLoaded', () => {
  console.log('loaded.');
  // Handle private chat access form
  let privateChatForm = document.getElementById("private-chat-form");
  privateChatForm.addEventListener('submit', takePrivateChatAccess);

  // Take a list of avaible public chatrooms via AJAX request:
  const getChatListRecurrently = () => {
    console.log('...');
    const listNode = document.getElementById('allowed-chatrooms');
    receiveChatsList(listNode).then(() => setTimeout(getChatListRecurrently, CHAT_UPDATE_INTERVAL))
  };

  getChatListRecurrently();

});

/* Functions */
function receiveChatsList(listNode, requestOptions = GET_PARAMS) {
  let url = window.location.origin + "/chatrooms/list";
  const clearListNode = () => {while (listNode.firstChild) listNode.removeChild(listNode.lastChild); return true};
  const renderItem = (item) => {
    let itemNode = document.createElement('li');
    let link = document.createElement('a');
    link.setAttribute('href', "/chatrooms/"+item["id"]);
    link.textContent = item['name'];
    itemNode.appendChild(link);
    listNode.appendChild(itemNode);
  };

  return fetch(url, requestOptions)
    .then(verifyResponse)
    .then(res => res.json())
    .then(list => clearListNode() && list.forEach(renderItem))
    .catch(console.error);
}

async function takePrivateChatAccess(event) {
  event.preventDefault();
  let form = event.target;
  let url = window.location.origin + `/chatrooms/getaccess`;
  let body = { chatname: form.chatname.value, password: form.password.value };
  form.reset();
  [].forEach.call(form.elements, item => item.setAttribute('disabled', true));
  let response = await fetch(url, {
    method: 'POST',
    cors:'no-cors',
    credentials:'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  try {await verifyResponse(response);}
  catch (err) {return console.error("Failed to fetch:", err.message);}
  let responseData = await response.json();
  // response text will contain issue if permission denied
  // or link to chatroom instead
  if (response.status === 200) {
    let accessNode = document.createElement('div');
    let text = document.createTextNode("access accept:");
    let link = document.createElement('a');
    link.setAttribute('href', responseData.url);
    link.textContent = "link";
    accessNode.appendChild(text);
    accessNode.appendChild(link);

    form.removeEventListener('submit', takePrivateChatAccess);
    form.parentNode.insertBefore(accessNode, form);
    form.parentNode.removeChild(form);
  } else {
    [].forEach.call(form.elements, item => item.removeAttribute('disabled'));
    let errorEl = document.getElementById('issues');
    while (errorEl.firstChild) errorEl.removeChild(errorEl.lastChild);
    for (let error of responseData.errors) {
      let el = document.createElement('p');
      el.className = 'issue';
      el.textContent = error.msg;
      errorEl.appendChild(el);
    }

  }
}

function verifyResponse(response) {
  return new Promise((resolve, reject) => {
    if (response.status < 500) resolve(response);
    else reject(new Error(response.statusText));
  });
}
