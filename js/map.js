$.ajaxSetup({
  async: false,
});

$(document).ready(function () {
  // sidebar 時間設定
  setDateDetail();
  //地圖載入
  setBasicMap();
});

function setDateDetail() {
  const num = Date.now();
  let dd = new Date(num);
  // 星期幾
  let weekdays = '星期日,星期一,星期二,星期三,星期四,星期五,星期六'.split(',');
  let nowWeekday = weekdays[dd.getDay()];
  document.getElementById('weekDay').textContent = nowWeekday;
  //日期
  let Y = dd.getFullYear() + ' - ';
  let M =
    (dd.getMonth() + 1 < 10 ? '0' + (dd.getMonth() + 1) : dd.getMonth() + 1) +
    ' - ';
  let D = dd.getDate() + ' ';
  document.getElementById('tDate').textContent = Y + M + D;
  //偶數奇數
  let whoToday;
  if (dd.getDay() % 2 === 0 && dd.getDay() !== 0) {
    whoToday = '偶數';
  } else if (dd.getDay() % 2 !== 0 && dd.getDay() != 0) {
    whoToday = '奇數';
  } else whoToday = 'null';
  document.getElementById('whoToday').textContent = whoToday;
}

function setBasicMap() {
  let data = getData();
  const map = L.map('map', {
    center: [25.047351, 121.5180114],
    zoom: 16,
  });
  //導入圖資
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  let markers = new L.MarkerClusterGroup().addTo(map);
  data.forEach(function (item) {
    let title = item.properties.name;
    let address = item.properties.address;
    let tel = item.properties.phone;
    let maskAdult = item.properties.mask_adult;
    let maskChild = item.properties.mask_child;
    markers.addLayer(
      L.marker([item.geometry.coordinates[1], item.geometry.coordinates[0]], {
        icon: selecltIconColor(maskAdult, maskChild),
      }).bindPopup(
        `
                <div class="popupBox">
                <h2>${title}</h2>
                <p>${address}</p>
                <p>連絡電話｜${tel}</p>
                <div class="maskBox">
                    <span class="btn ${maskCount(
                      maskAdult,
                      'adult'
                    )}">成人口罩<br> ${maskAdult} 個</span>
                    <span class="btn ${maskCount(
                      maskChild,
                      'kid'
                    )}">兒童口罩 ${maskChild} 個</span>
                </div>
                <a class="btn google" href="https://www.google.com.tw/maps/dir//${address}" target="_blank">Google 路線導航</a>
                </div>
                `
      )
    );
  });
  map.addLayer(markers);
  markers.on('click', function (e) {
    map.setView([e.latlng.lat, e.latlng.lng], 20);
  });
  setOptions(data, map);
}

function getData() {
  let data;
  $.getJSON(
    'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json',
    function (response, status) {
      data = response.features;
    }
  );
  return data;
}

function setOptions(data, map) {
  let cityList = [];
  let city = [];
  let area = [];

  data.forEach(function (item) {
    cityList.push(item.properties.county);
  });
  repeatDataFilter(cityList, city);

  for (let i = 0; i < city.length; i++) {
    let objCity = {};
    objCity.county = city[i];
    let townList = [];
    let town = [];
    for (let j = 0; j < data.length; j++) {
      if (data[j].properties.county === city[i]) {
        townList.push(data[j].properties.town);
        repeatDataFilter(townList, town);
      }
    }
    objCity.town = town;
    area.push(objCity);
  }

  let citySelect = document.getElementById('citySelect');
  let townSelect = document.getElementById('townSelect');

  area.forEach(function (item) {
    citySelect.add(new Option(item.county, item.county));
  });

  citySelect.addEventListener('change', function () {
    townSelect.length = 0;
    townSelect.add(new Option('請選擇鄉鎮區', '請選擇鄉鎮區'));
    for (let i = 0; i < citySelect.length - 1; i++) {
      if (citySelect.value === area[i].county) {
        for (let j = 0; j < area[i].town.length; j++) {
          townSelect.add(new Option(area[i].town[j], area[i].town[j]));
        }
      }
    }
  });

  townSelect.addEventListener('change', function (e) {
    createList(data, e);
    btnSetActive(data, e);
    moveToIcon(map, data);
    moveToTown(map);
  });
}

function repeatDataFilter(original, response) {
  original.forEach(function (value) {
    if (response.indexOf(value) === -1 && value !== '') {
      response.push(value);
    }
  });
}

function selecltIconColor(maskAdult, maskChild) {
  let iconColor;
  if (maskAdult !== 0 && maskChild !== 0) {
    iconColor = greenIcon;
  } else if (maskAdult == 0 && maskChild == 0) {
    iconColor = greyIcon;
  } else {
    iconColor = yellowIcon;
  }
  return iconColor;
}

function moveToIcon(map) {
  document.getElementById('nameList').addEventListener('click', function (e) {
    if (e.target.nodeName === 'H2') {
      let lat = e.target.dataset.lat;
      let lng = e.target.dataset.lng;
      map.setView([lng, lat], 20);
      L.popup()
        .setLatLng([lng, lat])
        .setContent(
          `
                    <div class="popupBox">
                    <h2>${e.target.dataset.name}</h2>
                    <p>${e.target.dataset.address}</p>
                    <p>連絡電話｜${e.target.dataset.tel}</p>
                    <div class="maskBox">
                        <span class="btn ${maskCount(
                          e.target.dataset.maskadult,
                          'adult'
                        )}">成人口罩<br> ${e.target.dataset.maskadult} 個</span>
                        <span class="btn ${maskCount(
                          e.target.dataset.maskchild,
                          'kid'
                        )}">兒童口罩 ${e.target.dataset.maskchild} 個</span>
                    </div>
                    <a class="btn google" href="https://www.google.com.tw/maps/dir//${
                      e.target.dataset.address
                    }" target="_blank">Google 路線導航</a>
                    </div>
                    `
        )
        .openOn(map);
    }
  });
}

function moveToTown(map) {
  let liH2 = $('#nameList > li:first')[0].firstElementChild;
  let lat = liH2.dataset.lat;
  let lng = liH2.dataset.lng;
  map.setView([lng, lat], 16);
}

function maskCount(maskCount, type) {
  if (maskCount === 0) {
    return null;
  } else {
    return type;
  }
}

function createList(data, target) {
  let list = document.getElementById('nameList');
  let str = '';
  let dataFilter = [];
  data.forEach(function (item) {
    if (
      item.properties.county === citySelect.value &&
      item.properties.town === target.target.value
    ) {
      dataFilter.push(item);
    }
  });

  let maskFilter = getActive();
  if (maskFilter === 1) {
    dataFilter = dataFilter.sort(function (a, b) {
      return a.properties.mask_adult < b.properties.mask_adult ? 1 : -1;
    });
  } else if (maskFilter === 2) {
    dataFilter = dataFilter.sort(function (a, b) {
      return a.properties.mask_child < b.properties.mask_child ? 1 : -1;
    });
  }
  list.innerHTML = chooseMaskboxCss(dataFilter);
}

function chooseMaskboxCss(data) {
  let str = '';
  data.forEach(function (item) {
    if (item.properties.mask_adult !== 0 && item.properties.mask_child !== 0) {
      str += `                <li>
            <h2 data-lat="${item.geometry.coordinates[0]}" data-lng="${item.geometry.coordinates[1]}" data-name="${item.properties.name}" data-tel="${item.properties.phone}" data-address="${item.properties.address}" data-maskAdult="${item.properties.mask_adult}" data-maskChild="${item.properties.mask_child}">${item.properties.name}</h2>
            <p>${item.properties.address}</p>
            <p>電話｜${item.properties.phone}</p>
            <div class="maskBox">
                <span class="btn adult">成人口罩 ${item.properties.mask_adult} 個</span>
                <span class="btn kid">兒童口罩 ${item.properties.mask_child} 個</span>
            </div>
        </li>`;
    }
    else if(item.properties.mask_adult === 0){
      str += `                <li>
      <h2 data-lat="${item.geometry.coordinates[0]}" data-lng="${item.geometry.coordinates[1]}" data-name="${item.properties.name}" data-tel="${item.properties.phone}" data-address="${item.properties.address}" data-maskAdult="${item.properties.mask_adult}" data-maskChild="${item.properties.mask_child}">${item.properties.name}</h2>
      <p>${item.properties.address}</p>
      <p>電話｜${item.properties.phone}</p>
      <div class="maskBox">
          <span class="btn noMask">成人口罩缺貨中</span>
          <span class="btn kid">兒童口罩 ${item.properties.mask_child} 個</span>
      </div>
    </li>`;
    }
    else if(item.properties.mask_child === 0){
      str += `                <li>
      <h2 data-lat="${item.geometry.coordinates[0]}" data-lng="${item.geometry.coordinates[1]}" data-name="${item.properties.name}" data-tel="${item.properties.phone}" data-address="${item.properties.address}" data-maskAdult="${item.properties.mask_adult}" data-maskChild="${item.properties.mask_child}">${item.properties.name}</h2>
      <p>${item.properties.address}</p>
      <p>電話｜${item.properties.phone}</p>
      <div class="maskBox">
          <span class="btn adult">成人口罩 ${item.properties.mask_adult} 個</span>
          <span class="btn noMask">兒童口罩缺貨中</span>
      </div>
  </li>`;
    }
    else{
      str += `                <li>
            <h2 data-lat="${item.geometry.coordinates[0]}" data-lng="${item.geometry.coordinates[1]}" data-name="${item.properties.name}" data-tel="${item.properties.phone}" data-address="${item.properties.address}" data-maskAdult="${item.properties.mask_adult}" data-maskChild="${item.properties.mask_child}">${item.properties.name}</h2>
            <p>${item.properties.address}</p>
            <p>電話｜${item.properties.phone}</p>
            <div class="maskBox">
                <span class="btn noMask">成人口罩缺貨中</span>
                <span class="btn noMask">兒童口罩缺貨中</span>
            </div>
        </li>`;
    }
  });
  return str;
}

function getActive() {
  let btnGroup = $('#maskGroup').children();
  for (let i = 0; i < btnGroup.length; i++) {
    if (btnGroup[i].classList.contains('active')) {
      return i;
    }
  }
}

function btnSetActive(data, e) {
  let btnGroup = $('#maskGroup').children();
  for (let i = 0; i < btnGroup.length; i++) {
    btnGroup[i].addEventListener('click', function () {
      $(this).siblings('.btn').removeClass('active');
      $(this).addClass('active');
      createList(data, e);
    });
  }
}
let greenIcon = new L.Icon({
  iconUrl:
    'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

let yellowIcon = new L.Icon({
  iconUrl:
    'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

let greyIcon = new L.Icon({
  iconUrl:
    'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function test() {}
