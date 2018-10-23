import {
  getArtistsTemplate,
  getEmptyArtistsTemplate,
  getPlaylistTemplate
} from './templates.js';

const SEARCH_URL = 'https://api.spotify.com/v1/search?q=';
const CLIENT_ID = '739bb8c6d81047a59b9e77ccb475d91c';
const URI = 'https://maslankam92.github.io/Spotify/';
// const URI = 'http://localhost:63340/Spotify/index.html';
const TOKEN_NAME = 'playlistSpotifyToken';
const HOOKS = {
  PLAYLIST: 'PLAYLIST',
  ARTISTS: 'ARTISTS',
  BOTH: 'BOTH'
};

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

function init() {
  checkToken();
  renderArtists([]);
  cacheDomListeners();
}

function setState(newState, hook) {

  state = {...state, ...newState};
  switch (hook) {
    case HOOKS.PLAYLIST:
      renderPlaylist();
      break;
    case HOOKS.ARTISTS:
      renderArtists();
      break;
    case HOOKS.BOTH:
      renderPlaylist();
      renderArtists();
      break;
  }
  // console.log(hooks);
}

/* Check if token exists in local storage.
 * If yes, check if is expired.
 *    If is expired, remove token and get a new one.
 * If no, check if token exists in url.
 *    If no, get new token.
 *    If yes, extract token from URL and save to local storage.*/
function checkToken() {
  let token;
  const localStorageToken = JSON.parse(localStorage.getItem(TOKEN_NAME));

  if (localStorageToken) {
    let now = new Date().getTime();
    const TOKEN_EXPIRY_MS = (60 * 60 * 1000);
    const tokenExpired = now - localStorageToken.timeStamp > TOKEN_EXPIRY_MS;

    if (tokenExpired) {
      localStorage.removeItem(TOKEN_NAME);
      redirectUser();
    }
    return
  }

  const tokenInURL =  window.location.hash.includes('access_token');
  if (!tokenInURL) {
    redirectUser();
  } else {
    token = window.location.hash.split('&')
      .filter(el => el.match('access_token') !== null)[0]
      .split('=')[1];
    const tokenObj = {
      token,
      timeStamp: new Date().getTime()
    };
    localStorage.setItem(TOKEN_NAME, JSON.stringify(tokenObj));
  }
}

/* Redirect user to Spotify authorization service to get access token. */
function redirectUser() {
  window.location.href =
    "https://accounts.spotify.com/authorize?client_id="
    + CLIENT_ID + "&redirect_uri="
    + URI + "&response_type=token&state=123";
}

/* Submit form another function */
async function onSearchFormSubmit(e) {
  e.preventDefault();
  if (!searchInput.value.trim()) return;

  try {
    setState({ artistsLoading: true }, HOOKS.ARTISTS);
    searchBtn.setAttribute('disabled', true);

    const artists = await getArtistResults(searchInput.value);

    setState({ artistsLoading: false, artists }, HOOKS.ARTISTS);
    searchBtn.removeAttribute('disabled');
    this.reset();
  } catch(e) {
    console.error(e);
  }
}

/* Requests artists data from Spotify API */
async function getArtistResults(artistName) {
  const headers = getRequestHeaders();
  const SEARCH_ARTIST_URL = `${SEARCH_URL}${artistName}&type=artist`;

  const response = await fetch(SEARCH_ARTIST_URL, { headers });
  const { artists, error } = await response.json();

  if (error) {
    throw new Error(error.message);
  }

  return await getTopSongs(artists.items);
}

/* Create headers for Spotify API calls  */
function getRequestHeaders() {
  return new Headers({
    'Authorization': `Bearer ${JSON.parse(localStorage.getItem(TOKEN_NAME)).token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  });
}

/* Get top songs from individual artist */
async function getTopSongs(artists) {
  const headers = getRequestHeaders();
  for (let artist of artists) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks?country=PL`, { headers });
    const tracks = await response.json();
    Object.assign(artist, tracks);
  }
  return artists
}

/* Render html list of artists */
function renderArtists() {
  let markup;
  if (state.artists.length > 0) {
    markup = getArtistsTemplate(state);
  } else {
    markup = getEmptyArtistsTemplate(state);
  }
  resultsArtists.innerHTML = markup;
}

/* Render markup for playlist */
function renderPlaylist() {
  const playlistOpen = state.playlist.length > 0;
  playlistOpen ? resultsWrapper.classList.add('playlist--open') : resultsWrapper.classList.remove('playlist--open');
  resultsPlaylist.innerHTML = getPlaylistTemplate(state);
}

/* Add track to playlist */
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
  setState({ playlist: [...state.playlist, trackToAdd] }, HOOKS.BOTH);
}

/* Remove track from playlist */
function removeTrackFromPlaylist({ target }) {
  if (!target.classList.contains('fa-trash')) return;

  let currentPlaying = state.currentPlaying;
  const { trackId } = target.dataset;
  let playlist = [...state.playlist].filter(track => track.id !== trackId);
  if (trackId === currentPlaying) {
    audio.pause();
    audio.removeAttribute('src');
    currentPlaying = '';
  }
  setState({ playlist, currentPlaying }, HOOKS.BOTH);
}

/* Toggle playing track */
function togglePlayingTrack({ target }) {
  if (target.classList.contains('fa-play')) {
    audio.setAttribute('src', target.dataset.trackUrl);
    audio.play()
      .then(x => setState({ currentPlaying: target.dataset.trackId }, HOOKS.PLAYLIST))
      .catch(e => console.log(e));
  } else if (target.classList.contains('fa-stop')) {
    audio.pause();
    setState({ currentPlaying: '' }, HOOKS.PLAYLIST);
  }
}

function cacheDomListeners() {
  searchForm.addEventListener('submit', onSearchFormSubmit);
  resultsArtists.addEventListener('click', addTrackToPlaylist);
  resultsPlaylist.addEventListener('click', removeTrackFromPlaylist);
  resultsPlaylist.addEventListener('click', togglePlayingTrack);
}

document.addEventListener('DOMContentLoaded', init);
