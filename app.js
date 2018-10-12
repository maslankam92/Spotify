const SEARCH_URL = 'https://api.spotify.com/v1/search?q=';
const CLIENT_ID = '739bb8c6d81047a59b9e77ccb475d91c';
// const URI = 'https://maslankam92.github.io/Spotify/';
const URI = 'http://localhost:63340/Spotify/index.html';

const searchForm = document.querySelector('.header__search-form');
const searchInput = document.querySelector('.header__search-form input');
const searchBtn = document.querySelector('.header__search-form button');
const resultsArtists = document.querySelector('.results__artists');
const resultsWrapper = document.querySelector('.results .wrapper');
const resultsPlaylist = document.querySelector('.results__playlist');
const audio = document.querySelector('#currentTrack');

let state = {
  artists: [],
  playlist: [],
  currentPlaying: '',
  artistsLoading: false
};

function renderArtists(artists) {
  let markup;
  if (artists.length > 0) {
    markup = artists.map(artist => {
      return `
        <div class="artists__card">
          <img class="card__img" alt="${artist.name}"
            src="${artist.images[0] && artist.images[0].url || 'https://semantic-ui.com/images/avatar2/large/matthew.png'}">
          <div class="card__content">
            <p class="content__name">${artist.name}</p>
            <div class="content__genres">
              <span class="genres__name">${artist.genres}</span>
            </div>
            <div class="content__artist-info">
              <span class="artist-info__followers">
                <i class="fas fa-heart"></i>
                ${artist.followers.total}
              </span>
              <a href="${artist.external_urls.spotify}" target="_blank" title="Go to Spotify" class="artist-info__link">
                <i class="fas fa-share"></i>
              </a>
            </div>
    
            <div class="content__songs">
              <p>Top Songs</p>
              <ul>
              ${
                artist.tracks.map(track => {
                return `
                  <li class="songs__item">
                    <div class="item__text">
                      <p class="text__title">${track.name}</p>
                      <p class="text__artist">${track.artists.map(artist => artist.name)}</p>
                    </div>
                    <a href="#" class="item__add-to-playlist-btn">
                      <i class="fas ${state.playlist.find(song => track.id === song.id) ? '' : 'fa-plus'}" data-artist-id="${artist.id}" data-track-id="${track.id}"></i>
                    </a>
                  </li>`               
                }).join('')
              }
  
              </ul>
            </div>
          </div>
        </div>
      `
    }).join('');
  } else {
    markup =
      `
        <div class="artists__empty">
          ${state.artistsLoading ? 
            '<span>Wait for it <i class="fas fa-spinner fa-pulse"></i></span>' : 
            '<span>Better use searchbox <i class="fas fa-search"></i></span>' 
          }
        </div>
      `
  }

  resultsArtists.innerHTML = markup;
}

async function onSearchFormSubmit(e) {
  e.preventDefault();
  if (!searchInput.value.trim()) return;

  try {
    state.artistsLoading = true;
    searchBtn.setAttribute('disabled', true);
    renderArtists([]);

    const artists = await getArtistResults(searchInput.value);

    state.artistsLoading = false;
    searchBtn.removeAttribute('disabled');
    this.reset();
    renderArtists(artists);
    state.artists = artists;
  } catch(e) {
    console.error(e);
  }
}

async function getArtistResults(artistName) {
  const headers = new Headers({
    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('playlistSpotifyToken')).token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });
  const SEARCH_ARTIST_URL = `${SEARCH_URL}${artistName}&type=artist`;
  const response = await fetch(SEARCH_ARTIST_URL, {headers});
  let { artists, error } = await response.json();

  if (error) {
    throw new Error(error.message);
  }

  async function getTopSongs(artists) {
    for(let artist of artists) {
      const response = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?country=PL`, {headers});
      const tracks = await response.json();
      Object.assign(artist, tracks);
    }
    return artists
  }

  return await getTopSongs(artists.items);

}

function checkToken() {
  let token;
  const localStorageToken = JSON.parse(localStorage.getItem('playlistSpotifyToken'));
  if (localStorageToken) {
    let now = new Date().getTime();
    const TOKEN_EXPIRY_MS = (60 * 60 * 1000);
    const tokenExpired = now - localStorageToken.timeStamp > TOKEN_EXPIRY_MS;
    if (tokenExpired) {
      localStorage.removeItem('playlistSpotifyToken');
      window.location.href = "https://accounts.spotify.com/authorize?client_id=" + CLIENT_ID + "&redirect_uri=" + URI + "&response_type=token&state=123";
    }
    return
  }

  const tokenInURL =  window.location.hash.includes('access_token');
  if (!tokenInURL) {
    window.location.href = "https://accounts.spotify.com/authorize?client_id=" + CLIENT_ID + "&redirect_uri=" + URI + "&response_type=token&state=123";
  } else {
    token = window.location.hash.split('&')
      .filter(el => el.match('access_token') !== null)[0]
      .split('=')[1];
    const tokenObj = {
      token,
      timeStamp: new Date().getTime()
    };
    localStorage.setItem('playlistSpotifyToken', JSON.stringify(tokenObj));
  }
}

checkToken();
renderArtists([]);

function renderPlaylist() {
  const playlistOpen = state.playlist.length > 0;
  playlistOpen ? resultsWrapper.classList.add('playlist--open') : resultsWrapper.classList.remove('playlist--open');

  const playlistMarkup = `
    <p>Your Playlist</p>
    <ul>
      ${
        state.playlist.map((song, i) => {
        return `
          <li class="playlist__song">
            <a href="#" class="song__play-btn">
              <i class="fas ${state.currentPlaying === song.id ? 'fa-stop' : 'fa-play'}" 
                data-track-id="${song.id}"
                data-track-url="${song.preview_url}"></i>
            </a>
            <div class="song__text">
              <p class="text__title">${song.name}</p>
              <p class="text__artist">${song.artists.map(artist => artist.name)}</p>
            </div>
            <a href="#" class="song__delete-btn">
              <i class="fas fa-trash" data-track-id="${song.id}"></i>
            </a>
          </li>`
        }).join('')
      }
    </ul>`;
  resultsPlaylist.innerHTML = playlistMarkup;
}

function addTrackToPlaylist({ target }) {
  if (!target.classList.contains('fa-plus')) return;

  const { artistId, trackId } = target.dataset;
  const trackToAdd = state.artists.reduce((acc, artist) => {
    let obj = {};
    if (artist.id === artistId) {
      obj = artist.tracks.find(track => track.id === trackId);
    }
    return Object.assign({}, acc, obj);
  }, {});
  state.playlist.push(trackToAdd);
  renderPlaylist();
  renderArtists(state.artists);
}

function removeTrackFromPlaylist({ target }) {
  if (!target.classList.contains('fa-trash')) return;
  const { trackId } = target.dataset;
  state.playlist = [...state.playlist].filter(track => track.id !== trackId);
  if (trackId === state.currentPlaying) {
    audio.pause();
    audio.removeAttribute('src');
    state.currentPlaying = '';
  }
  renderPlaylist();
  renderArtists(state.artists);
}

function togglePlayingTrack({ target }) {
  if (target.classList.contains('fa-play')) {
    audio.setAttribute('src', target.dataset.trackUrl);
    audio.play()
      .then(x => {
        state.currentPlaying = target.dataset.trackId;
        renderPlaylist();
      })
      .catch(e => console.log(e));
  } else if (target.classList.contains('fa-stop')) {
    audio.pause();
    state.currentPlaying = '';
    renderPlaylist();
  }
}

searchForm.addEventListener('submit', onSearchFormSubmit);
resultsArtists.addEventListener('click', addTrackToPlaylist);
resultsPlaylist.addEventListener('click', removeTrackFromPlaylist);
resultsPlaylist.addEventListener('click', togglePlayingTrack);
