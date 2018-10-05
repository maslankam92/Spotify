const SEARCH_URL = 'https://api.spotify.com/v1/search?q=';
const CLIENT_ID = '739bb8c6d81047a59b9e77ccb475d91c';
const URI = 'http://localhost:63340/Spotify/index.html';

const searchForm = document.querySelector('.header__search-form');
const searchInput = document.querySelector('.header__search-form input');

async function onSearchFormSubmit(e) {
  e.preventDefault();
  try {
    const results = await getArtistResults(searchInput.value);
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
  const artistData = await response.json();

  if (artistData.error) {
    throw new Error(artistData.error.message);
  }
  return artistData
}

function checkToken() {
  let token;
  const localStorageToken = JSON.parse(localStorage.getItem('playlistSpotifyToken'));
  if (localStorageToken) return;

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

searchForm.addEventListener('submit', onSearchFormSubmit);