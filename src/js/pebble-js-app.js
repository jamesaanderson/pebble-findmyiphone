function getPartition() {
  var body = {
    clientContext: {
      appName: 'FindMyiPhone',
      appVersion: '1.4',
      buildVersion: '145',
      deviceUDID: '0000000000000000000000000000000000000000',
      inactiveTime: 2147483647,
      osVersion: '4.2.1',
      personID: 0,
      productType: 'iPad1,1'
    }
  };
  post('fmipservice/device/'+localStorage.email+'/initClient', body, function(req) {
    localStorage.setItem('partition', req.getResponseHeader('X-Apple-MMe-Host'));
  });
}

function updateDevices() {
  if (localStorage.partition === null) {
    getPartition();
  }

  var body = {
    clientContext: {
      appName: 'FindMyiPhone',
      appVersion: '1.4',
      buildVersion: '145',
      deviceUDID: '0000000000000000000000000000000000000000',
      inactiveTime: 2147483647,
      osVersion: '4.2.1',
      personID: 0,
      productType: 'iPad1,1'
    }
  };
  post('fmipservice/device/'+localStorage.email+'/initClient', body, function(req) {
    var res = JSON.parse(req.responseText);
    res.content.forEach(function(element, index, array) {
      Pebble.sendAppMessage({'index': index, 'id': element.id, 'name': element.name});
    });
  });
}

function playSound(id) {
  var body = {
    clientContext: {
      appName: 'FindMyiPhone',
      appVersion: '1.4',
      buildVersion: '145',
      deviceUDID: '0000000000000000000000000000000000000000',
      inactiveTime: 2147483647,
      osVersion: '4.2.1',
      personID: 0,
      productType: 'iPad1,1'
    },
    serverContext: {
      callbackIntervalInMS: 3000,
      clientId: '0000000000000000000000000000000000000000',
      deviceLoadStatus: '203',
      hasDevices: true,
      lastSessionExtensionTime: null,
      maxDeviceLoadTime: 60000,
      maxLocatingTime: 90000,
      preferredLanguage: 'en',
      prefsUpdateTime: 1276872996660,
      sessionLifespan: 900000,
      timezone:{
        currentOffset: -25200000,
        previousOffset: -28800000,
        previousTransition: 1268560799999,
        tzCurrentName: 'Pacific Daylight Time',
        tzName: 'America/Los_Angeles'
      },
      validRegion:true
    },
    device: id,
    subject: 'Find My iPhone Alert'
  };
  post('fmipservice/device/'+localStorage.email+'/playSound', body, function(req) {
    console.log(req.responseText);
  });
}

function post(path, body, callback) {
  var req = new XMLHttpRequest();
  var url = localStorage.partition !== null ? 'https://'+localStorage.partition+'/' : 'https://fmipmobile.icloud.com/';
  req.open('POST', url + path, true);

  req.setRequestHeader('Content-type', 'application/json; charset=utf-8');
  req.setRequestHeader('X-Apple-Find-Api-Ver', '2.0');
  req.setRequestHeader('X-Apple-Authscheme', 'UserIdGuest');
  req.setRequestHeader('X-Apple-Realm-Support', '1.0');
  req.setRequestHeader('User-agent', 'Find iPhone/1.2 MeKit (iPad: iPhone OS/4.2.1)');
  req.setRequestHeader('X-Client-Name', 'iPad');
  req.setRequestHeader('X-Client-UUID', '0cf3dc501ff812adb0b202baed4f37274b210853');
  req.setRequestHeader('Accept-Language', 'en-us');
  req.setRequestHeader('Connection', 'keep-alive');
  req.setRequestHeader('Authorization', 'Basic '+encode64(localStorage.email+':'+localStorage.password));

  req.send(JSON.stringify(body));
  req.onload = function(e) {
    callback(req);
  };
}

// from http://ntt.cc/2008/01/19/base64-encoder-decoder-with-javascript.html
function encode64(input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var output, chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  output = chr1 = chr2 = chr3 = enc1 = enc2 = enc3 = enc4 = '';
  var i = 0;
  do {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);
    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;
    if (isNaN(chr2)) { enc3 = enc4 = 64; } else if (isNaN(chr3)) { enc4 = 64; }
    output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
    chr1 = chr2 = chr3 = enc1 = enc2 = enc3 = enc4 = '';
  } while (i < input.length);
  return output;
}

Pebble.addEventListener('ready', function(e) {
  if (localStorage.email === null && localStorage.password === null) {
    updateDevices();
  }
});

Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL('https://dl.dropboxusercontent.com/s/s1qcypqfrt351pj/configuration.html');
});

Pebble.addEventListener('webviewclosed', function(e) {
  var configuration = JSON.parse(decodeURIComponent(e.response));
  localStorage.setItem('email', configuration.email);
  localStorage.setItem('password', configuration.password);

  updateDevices();
});

Pebble.addEventListener('appmessage', function(e) {
  playSound(e.payload.id);
  console.log(e.payload.id);
});
