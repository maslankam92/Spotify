document.addEventListener('DOMContentLoaded', function () {

  // const SEARCH_URL = 'https://api.spotify.com/v1/search';
  // const CLIENT_ID = '739bb8c6d81047a59b9e77ccb475d91c';
  // const URI = 'http://localhost:63340/Spotify/index.html';
  //
  // window.location.href = "https://accounts.spotify.com/authorize?client_id=" + CLIENT_ID + "&redirect_uri=" + URI + "&response_type=token&state=123";


  const searchForm = document.querySelector('.header__search-form');
  const searchInput = document.querySelector('.header__search-form input');


  let state = {
    formInput: ''
  };

  function onSearchFormSubmit(e) {
    e.preventDefault();
    console.dir(searchInput.value);

   fetch('https://accounts.spotify.com/authorize')
     .then(data => console.log(data));

    // fetch('https://api.spotify.com/v1/search?q=' + searchInput.value + 'tede&type=artist', {
    //   method: 'GET',
    //   headers: new Headers({
    //     Accept: "application/json",
    //     Authorization: "Bearer BQBzGTlZhFA5czOFQ7s4rfHadJZ6QVzhtEKeGr4l6jOv9AQ6trtuZLz90CbFAJPtPM4HtoBptGJgqBom3YYReDH4cI4dHWR1D9CrSLcbCx12rRyaMVH4QOhjAXJBColNOEDl7u2sd_Oyrj8"
    //   })
    // })
    //   .then(data => data.json())
    //   .then(res => console.log(res));

  }

  searchForm.addEventListener('submit', onSearchFormSubmit);

  let token = window.location.hash.split('&')
    .filter(e => e.match('access_token') !== null)
    [0].split('=')[1];
  console.log(token);

    //





});