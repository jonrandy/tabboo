
function Tab (name, url, favicon, created) {
  this.name = name;
  this.url = url;
  this.favicon = favicon;
  this.created = created;
}

let currentTabs = [];

  const query = browser.tabs.query({currentWindow:true}).then(query => {
    const now = new Date().toUTCString();

    return query.map(tab => {
      return new Tab(tab.title, tab.url, tab.favIconUrl || 'http://via.placeholder.com/30', now);
    }).filter(tab => !tab.url.search('http'));
  });

  query.then(array => {
    const elSave = document.querySelector('.session__save');
    const elOpen = document.querySelector('.session__open');
    const elNav = document.querySelector('.nav');
    const elEdit = document.querySelector('.session__edit');
    const elSaveEdit = document.querySelector('.session__saveEdit');

    document.querySelector('.session__date').innerHTML = new Date().toUTCString();

    if(array[0]) { displaySession(array);}

    displaySidebar();
    elSave.addEventListener('click', () => saveSession(array), {capture: false});
    elOpen.addEventListener('click', openSession, false);
    elEdit.addEventListener('click', editSession, false);
    elNav.addEventListener('keyup', () => searchSession(array), false);
    elSaveEdit.addEventListener('click', saveEdit);

  });


function openSession(){
  const urls = currentTabs.map((obj) => {
    return obj.url;
  });

  browser.windows.create({url: urls});
}


function displaySidebar(){
  const sidebar = document.querySelector('.sidebar__wrapper');
  const storage = browser.storage.local;


  storage.get(null).then(sessions => {
    const stored = Object.keys(sessions).map(key => {
      let date = sessions[key][0].created.split(' ');
      date = `${date[1]} ${date[2]}`;

      return `<div data-session="${key}" class="saved">
              <div class="saved__color"></div>
              <a class="saved__name">${key}</a>
              <a class="saved__delete">&#10005;</a>
              <div class="saved__meta">
                <a class="saved__amount"><span class="amount__number">${sessions[key].length} </span>${sessions[key].length > 1? 'Tabs' : 'Tab'}</a>
                <a class="saved__date">${date}</a>
              </div>
          </div>`;
    }).join('');
    sidebar.innerHTML = stored;

    sidebar.addEventListener('click', sidebarActions.bind(null, sessions), false);
  });
}


function sidebarActions(sessionName, e){

  const target = e.target.dataset.session || e.target.parentNode.dataset.session;

  if (e.target.classList.contains('saved__delete')) {
    deleteSession(target);

  } else if(e.target.parentNode.classList.contains('saved') || e.target.classList.contains('saved')) {
    displaySession(sessionName[target]);

    document.querySelector('#session__namer').style.display = 'none';
    document.querySelector('#session__name').style.display = 'block';

    document.querySelector('#session__name').innerHTML = target;
  }
}

function deleteSession(sessionName){
  browser.storage.local.remove(sessionName).then(item => {
    displaySidebar();
  });
}


  function displaySession(array){
    const tabs = document.querySelector('.tabs');

    tabs.innerHTML = array.map((tab, index) => {
      index++;
      return `<li class="tab">
              <a class="tab__number">${index}</a>
              <img type="image/ico" class="tab__favicon" src="${tab.favicon}" />
              <div class="tab__links">
                <a class="tab__title">${tab.name}</a>
                <a class="tab__url" src="${tab.url}">${tab.url}</a>
              </div>
            </li>`;
    }).join('');

    let multipleTabs =`${array.length > 1? 'Tabs' : 'Tab'}`;
    multipleTabs? document.querySelector('.session__amount').style.width = '91px' : '';

    const count = document.querySelector('.session__amount').innerHTML = `<span class="amount__number session__number">${array.length}</span> ${multipleTabs} `;
    const date = document.querySelector('.session__date').innerHTML = array[0].created;

    currentTabs = array;
  }

  function nameSession(resolve, elName, e){
      if(elName.value.trim() === '') {
        elName.placeholder = `Can't be empty`;
        return;
      }
      resolve(elName.value);
  }



  function saveSession(array) {
    const elName = document.querySelector('#session__namer');
    const storage = browser.storage.local;
    const saveButton = document.querySelector('.session__save');

    const name = elName.value;

    if(name.trim() === '') {
      elName.placeholder = "Don't forget to name the session!";
      elName.focus();
      return;
    }
      storage.set({[name.trim()]:array}).then(arr => {
        browser.runtime.reload();
    });
  }

  function searchSession(array){

      const input = document.querySelector('.nav__search').value;
      const sidebarWrapper = document.querySelector('.sidebar__wrapper');

      browser.storage.local.get(null).then(sessions => {
        const sessionsArray = Object.entries(sessions);

      const result =  sessionsArray.filter(obj => Object.keys(obj).some(key => obj[key].includes(input)));

      sidebarWrapper.innerHTML = result.map(saved => {

        let date = saved[1][0].created.split(' ');
        date = `${date[1]} ${date[2]}`;

        return `<div data-session="${saved[0]}" class="saved">
                  <div class="saved__color"></div>
                  <a class="saved__name">${saved[0]}</a>
                  <a class="saved__delete">x</a>
                <div class="saved__meta">
                    <a class="saved__amount"><span class="amount__number">${sessions[saved[0]].length} </span>${sessions[saved[0]].length > 1? 'Tabs' : 'Tab'}</a>
                    <a class="saved__date">${date}</a>
                </div>
              </div>`;
      }).join('');
      });
  }

  function editSession(){
    const sessionName = document.querySelector('#session__name');
    const sessionNamer = document.querySelector('#session__namer');
    const tabs = Array(... document.querySelectorAll('.tab'));

    if(sessionName.innerHTML === '') {
      return;
    }

    sessionName.style.display = 'none';
    sessionNamer.value = sessionName.innerHTML;
    sessionNamer.focus();
    sessionNamer.style.borderBottom = '2px solid pink';
    sessionNamer.style.display = 'block';

    document.querySelector('.session__save').style.display = 'none';
    document.querySelector('.session__saveEdit').style.display = 'block';

    tabs.map(tab => {
      const node = document.createElement('a');
      node.appendChild(document.createTextNode('x'));
      node.classList.add('tab__delete');

      node.addEventListener('click', (e) => deleteTab(e));
      tab.appendChild(node);
    });
  }

  function deleteTab(e){
    e.target.parentNode.remove();
  }

  function saveEdit(){
    const tabs = Array(... document.querySelectorAll('.tab'));
    const name = document.querySelector('#session__namer').value;
    const date = document.querySelector('.session__date').innerHTML;

    const tabsObj = tabs.map(tab => {
      return new Tab(tab.childNodes[5].childNodes[1].textContent.trim(), tab.childNodes[5].childNodes[3].textContent.trim(), tab.childNodes[3].src, date);
    });

    if (tabsObj.length < 1) {
      return;
    }

    browser.storage.local.set({[name.trim()]:tabsObj}).then(arr => {
      browser.runtime.reload();
  });

    // console.log(tabsObj);

  }
