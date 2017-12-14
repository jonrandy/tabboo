
function Tab (name, url, favicon, created) {
  this.name = name;
  this.url = url;
  this.favicon = favicon;
  this.created = created;
}

let currentTabs = [];

  const query = browser.tabs.query({}).then(query => {
    return query.map(tab => {
      return new Tab(tab.title, tab.url, tab.favIconUrl? tab.favIconUrl : 'http://via.placeholder.com/30', new Date().toUTCString());
    });
  });

  query.then(array => {

    array = array.filter(function(item){
      return !item.url.search('http');
    });

    const elSave = document.querySelector('.legend__save');
    const elOpen = document.querySelector('.legend__open');


    displaySession(array);
    displaySidebar();
    elSave.addEventListener('click', saveSession.bind(null, array), {capture: false});
    elOpen.addEventListener('click', openSession.bind(null, currentTabs), false);

  });


function openSession(current){
  const urls = currentTabs.map(function(obj){
    return obj.url;
  });

  // console.log(urls);
  browser.windows.create({url: urls});
}

function displaySidebar(){
  const sidebar = document.querySelector('.sidebar');
  const storage = browser.storage.local;

  storage.get(null).then(obj => {
    const stored = 'Saved Sessions' + Object.keys(obj).map(key => {
      return `<div data="${key}" class="session">
                <a class="session__delete">x</a>
                ${key}
                <a class="tab__amount">${obj[key].length} ${obj[key].length > 1? 'Tabs' : 'Tab'}</a>
              </div>`;
    }).join('');
    sidebar.innerHTML = stored;

     sidebar.addEventListener('click', sidebarActions.bind(null, obj), false);
  });
}

function sidebarActions(obj, e){
  const target = e.target.getAttribute('data') || e.target.parentNode.getAttribute('data');

  if (e.target.classList == 'session__delete') {
    deleteSession(target);

  } else if(e.target.parentNode.classList =='session' || e.target.classList == 'session') {
    displaySession(obj[target]);
    document.querySelector('.session__name').innerHTML = target;
  }
}

function deleteSession(obj){
  browser.storage.local.remove(obj).then(item => {
    displaySidebar();
  });
}



  function displaySession(array){
    // displaySidebar();

    const tabs = document.querySelector('.tabs');

    const html = array.map(item => {
      return `<li class="tab">
                <img class="icon" src="${item.favicon}" />
                <a class="tab__title">${item.name}</a>
                <a class="tab__url" src="${item.url}">${item.url}</a>
              </li>`;
    }).join('');
    tabs.innerHTML = html;

    const count = document.querySelector('.legend__amount').innerHTML = `${array.length} ${array.length > 1? 'Tabs' : 'Tab'}`;
    const date = document.querySelector('.legend__recorded').innerHTML = array[0].created;

    currentTabs = array;
    return currentTabs;
  }

  function nameSession(resolve, elName, e){
    if(e.keyCode === 13) {
      if(elName.value === '' || elName.value === ' ') {
        elName.placeholder = `Can't be empty`;
        return;
      }
      resolve(elName.value);
    }
  }






  function saveSession(array) {
    const elName = document.querySelector('#session__namer');
    const storage = browser.storage.local;
    const saveButton = document.querySelector('.legend__save');

    saveButton.style.display = 'none';
    elName.style.display = 'block';

    const namer = new Promise(function(resolve){
       window.addEventListener('keyup', nameSession.bind(null, resolve, elName));
    });

    namer.then(namer => {
      storage.set({[namer]:array}).then(arr => {
        // displaySidebar();
        browser.runtime.reload();
      });
    });
  }
