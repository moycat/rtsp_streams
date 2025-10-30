$(document).ready(() => {
  localImages();
  if (localStorage.getItem('defaultPlayer') != null) {
    $('input[name=defaultPlayer]').val([localStorage.getItem('defaultPlayer')]);
  }
})
$('input[name=defaultPlayer]').on('change', function() {
  localStorage.setItem('defaultPlayer', $(this).val());
})

function renewStreamlist() {
  goRequest('streams');
}

function goRequest(method, uuid, data) {
  data = data || null;
  uuid = uuid || null;
  var path = '';
  var type = 'GET';
  switch (method) {
    case 'add':
      path = '/stream/' + uuid + '/add';
      type = 'POST';
      break;
    case 'edit':
      path = '/stream/' + uuid + '/edit';
      type = 'POST';
      break;
    case 'delete':
      path = '/stream/' + uuid + '/delete';
      break;
    case 'reload':
      path = '/stream/' + uuid + '/reload';
      break;
    case 'info':
      path = '/stream/' + uuid + '/info';
      break;
    case 'streams':
      path = '/streams';
      break;
    default:
      path = '';
      type = 'GET';
  }
  if (path == '') {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'It`s goRequest function mistake',
      confirmButtonText: 'Close',

    })
    return;
  }
  var ajaxParam = {
    url: path,
    type: type,
    dataType: 'json',
    beforeSend: function(xhr) {
      xhr.setRequestHeader("Authorization", "Basic " + btoa("demo:demo"));
    },
    success: function(response) {
      goRequestHandle(method, response, uuid);
    },
    error: function(e) {
      console.log(e);
    }
  };
  if (data != null) {
    ajaxParam.data = JSON.stringify(data);
  }
  $.ajax(ajaxParam);
}

function goRequestHandle(method, response, uuid) {
  switch (method) {
    case 'add':

      if (response.status == 1) {
        renewStreamlist();
        Swal.fire(
          'Added!',
          'Your stream has been Added.',
          'success'
        );

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Same mistake issset',
        })
      }

      break;
    case 'edit':
      if (response.status == 1) {
        renewStreamlist();
        Swal.fire(
          'Success!',
          'Your stream has been modified.',
          'success'
        );
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Same mistake issset',
        })
      }
      break;
    case 'delete':

      if (response.status == 1) {
        $('#' + uuid).remove();
        delete(streams[uuid]);
        $('#stream-counter').html(Object.keys(streams).length);
        Swal.fire(
          'Deleted!',
          'Your stream has been deleted.',
          'success'
        )
      }

      break;
    case 'reload':

      break;
    case 'info':

      break;
    case 'streams':
      if (response.status == 1) {
        streams = response.payload;
        $('#stream-counter').html(Object.keys(streams).length);
        if (Object.keys(streams).length > 0) {

          $.each(streams, function(uuid, param) {
            if ($('#' + uuid).length == 0) {
              $('.streams').append(streamHtmlTemplate(uuid, param.name));
            }
          })
        }
      }

      break;
    default:

  }
}

function getImageBase64(videoEl){
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL();
    canvas.remove();
    return dataURL;
}

function downloadBase64Image(base64Data){
    const a = document.createElement("a");
    a.href = base64Data;
    a.download = "screenshot.png";
    a.click();
    a.remove();
}


function makePic(video_element, uuid, chan) {
  if (typeof(video_element) === "undefined") {
    video_element = $("#videoPlayer")[0];
  }
  ratio = video_element.videoWidth / video_element.videoHeight;
  w = 400;
  h = parseInt(w / ratio, 10);
  $('#canvas')[0].width = w;
  $('#canvas')[0].height = h;
  $('#canvas')[0].getContext('2d').fillRect(0, 0, w, h);
  $('#canvas')[0].getContext('2d').drawImage(video_element, 0, 0, w, h);
  var imageData = $('#canvas')[0].toDataURL();
  var images = localStorage.getItem('imagesNew');
  if (images != null) {
    images = JSON.parse(images);
  } else {
    images = {};
  }
  var uid = $('#uuid').val();
  if (!!uuid) {
    uid = uuid;
  }

  var channel = $('#channel').val() || chan || 0;
  if (typeof(images[uid]) === "undefined") {
    images[uid] = {};
  }
  images[uid][channel] = imageData;
  localStorage.setItem('imagesNew', JSON.stringify(images));
  $('#' + uid).find('.stream-img[channel="' + channel + '"]').attr('src', imageData);
}

function localImages() {
  var images = localStorage.getItem('imagesNew');
  if (images != null) {
    images = JSON.parse(images);
    $.each(images, function(k, v) {
      $.each(v, function(channel, img) {
        $('#' + k).find('.stream-img[channel="' + channel + '"]').attr('src', img);
      })

    });
  }
}

function clearLocalImg() {
  localStorage.setItem('imagesNew', '{}');
}

function streamHtmlTemplate(uuid, name) {
  return '<div class="item" id="' + uuid + '">' +
    '<div class="stream">' +
    '<div class="thumbs" onclick="rtspPlayer.livePlayer(0, \'' + uuid + '\')">' +
    '<img src="../static/img/noimage.svg" alt="" class="stream-img">' +
    '</div>' +
    '<div class="text">' +
    '<h5>' + name + '</h5>' +
    '<p>property</p>' +
    '<div class="input-group-prepend dropleft text-muted">' +
    '<a class="btn" data-toggle="dropdown" >' +
    '<i class="fas fa-ellipsis-v"></i>' +
    '</a>' +
    '<div class="dropdown-menu">' +
    '<a class="dropdown-item" onclick="rtspPlayer.livePlayer(\'hls\', \'' + uuid + '\')" href="#">Play</a>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function randomUuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function validURL(url) {
  //TODO: fix it
  return true;
}

function Utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;
  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 7:
        out += String.fromCharCode(c);
        break;
      case 13:
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
          ((char2 & 0x3F) << 6) |
          ((char3 & 0x3F) << 0));
        break;
    }
  }
  return out;
}

function removeChannelDiv(element) {
  $(element).closest('.col-12').remove();
}

function logger() {
  if (!colordebug) {
    return;
  }
  let colors = {
    "0": "color:green",
    "1": "color:#66CDAA",
    "2": "color:blue",
    "3": "color:#FF1493",
    "4": "color:#40E0D0",
    "5": "color:red",
    "6": "color:red",
    "7": "color:red",
    "8": "color:red",
    "9": "color:red",
    "10": "color:red",
    "11": "color:red",
    "12": "color:red",
    "13": "color:red",
    "14": "color:red",
    "15": "color:red",
  }
  console.log('%c%s', colors[arguments[0]], new Date().toLocaleString() + " " + [].slice.call(arguments).join('|'))
}
