const GET_PARAMS = {
  method:'GET',
  cors:'no-cors',
  credentials:'same-origin'
}

// Handle private chat access form
let privateChatForm = document.getElementById("private-chat-form");
privateChatForm.addEventListener('submit', takePrivateChatAccess);

// Take a list of avaible public chatrooms via AJAX request:
let getChatsButton = document.getElementById("get-chatlist");
getChatsButton.addEventListener('click', () => {
  getChatsButton.parentNode.removeChild(getChatsButton);
}, {once:true});
getChatsButton.addEventListener('click', () => receiveChatsList(
  document.getElementById('public-chatrooms')), {once:true});

/* Functions */
function receiveChatsList(listNode, requestOptions = GET_PARAMS) {
  let url = window.location.origin + "/chatrooms/public";
  const renderItem = item => {
    let itemNode = document.createElement('li');
    let link = document.createElement('a');
    link.setAttribute('href', "/chatrooms/"+item["room_id"]);
    link.textContent = item['room_name'];
    itemNode.appendChild(link);
    listNode.appendChild(itemNode);
  }

  fetch(url, requestOptions)
    .then(verifyResponse)
    .then(res => res.json())
    .then(list => list.forEach(renderItem))
    .catch(console.error);
}

async function takePrivateChatAccess(event) {
  event.preventDefault();
  let form = event.target;
  let queryString = []
    .filter.call(form.elements, item => !!item.name)
    .map(item => `${item.name}=${encodeURIComponent(item.value)}`)
    .join("&");
  let url = window.location.origin + `/chatrooms/getaccess?${queryString}`;
  form.reset();
  [].forEach.call(form.elements, item => item.setAttribute('disabled', true));

  let response = await fetch(url, GET_PARAMS);
  try {await verifyResponse(response);}
  catch (err) {return console.error("Failed to fetch:", err.message);}
  let responseData = await response.text();
  // response text will contain issue if permission denied
  // or link to chatroom instead
  if (response.status == 200) {
    let accessNode = document.createElement('p');
    let text = document.createTextNode("access accept:")
    let link = document.createElement('a');
    link.setAttribute('href', responseData);
    link.textContent = "link";
    accessNode.appendChild(text);
    accessNode.appendChild(link);

    form.removeEventListener('submit', takePrivateChatAccess);
    form.parentNode.insertBefore(accessNode, form);
    form.parentNode.removeChild(form);
  } else {
    [].forEach.call(form.elements, item => item.removeAttribute('disabled'));
    form.querySelector(".issue").textContent = responseData;
  }
}

function verifyResponse(response) {
  return new Promise((resolve, reject) => {
    if (response.status < 500) resolve(response);
    else reject(new Error(response.statusText));
  });
}
