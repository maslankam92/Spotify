function getArtistsTemplate(state) {
  return state.artists.map(artist => {
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
}

function getEmptyArtistsTemplate(state) {
  return `
    <div class="artists__empty">
      ${state.artistsLoading ?
      '<span>Wait for it <i class="fas fa-spinner fa-pulse"></i></span>' :
      '<span>Better use searchbox <i class="fas fa-search"></i></span>'
      }
    </div>  
  `
}

function getPlaylistTemplate(state) {
  return`
    <p>Your Playlist</p>
      <ul>
      ${
        state.playlist.map(song => {
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
}

export { getArtistsTemplate, getEmptyArtistsTemplate, getPlaylistTemplate };