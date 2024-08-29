import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactModal from 'react-modal';
import YouTube from 'react-youtube';
import './App.css';

// For accessibility reasons, it's good to set the root element for ReactModal
ReactModal.setAppElement('#root');

const App = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMovies();
  }, [searchQuery, currentPage]);

  const fetchMovies = async () => {
    try {
      const response = searchQuery
        ? await axios.get('https://api.themoviedb.org/3/search/movie', {
            params: {
              api_key: '1ed011566a44232f76b6cdaf845c8eb2', // Replace with your actual API key
              query: searchQuery,
              page: currentPage,
            },
          })
        : await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            params: {
              api_key: '1ed011566a44232f76b6cdaf845c8eb2', // Replace with your actual API key
              page: currentPage,
            },
          });

      setMovies(response.data.results);
      setTotalPages(response.data.total_pages);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleMovieClick = async (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);

    try {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
        params: {
          api_key: '1ed011566a44232f76b6cdaf845c8eb2', // Replace with your actual API key
        },
      });

      const trailer = response.data.results.find(video => video.type === 'Trailer');
      if (trailer) {
        setSelectedMovie(prevMovie => ({
          ...prevMovie,
          trailerId: trailer.key,
        }));
      } else {
        setSelectedMovie(prevMovie => ({ ...prevMovie, trailerId: null }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMovie(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const opts = {
    height: '315',
    width: '560',
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <div className="app-container">
      <h1>WeMovies</h1>
      <form className="search-form" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a movie..."
        />
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <>
          <div className="movies-list">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="movie-item"
                onClick={() => handleMovieClick(movie)}
              >
                <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
                <h3>{movie.title}</h3>
                <p>{movie.release_date}</p>
              </div>
            ))}
          </div>
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
      {selectedMovie && (
        <ReactModal isOpen={showModal} onRequestClose={closeModal} className="modal">
          <h2>{selectedMovie.title}</h2>
          {selectedMovie.trailerId ? (
            <YouTube
              videoId={selectedMovie.trailerId}
              opts={opts}
              className="youtube-video"
              onReady={(e) => console.log('Player ready:', e)}
              onPlay={() => console.log('Video playing')}
              onPause={() => console.log('Video paused')}
              onEnd={() => console.log('Video ended')}
              onError={(e) => console.error('Error:', e)}
              onStateChange={(e) => console.log('State changed:', e)}
              onPlaybackRateChange={(e) => console.log('Playback rate changed:', e)}
              onPlaybackQualityChange={(e) => console.log('Playback quality changed:', e)}
            />
          ) : (
            <p>No trailer available</p>
          )}
          <button onClick={closeModal}>Close</button>
        </ReactModal>
      )}
    </div>
  );
};

export default App;
