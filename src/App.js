import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import ReactModal from 'react-modal';
import YouTube from 'react-youtube';
import './App.css';
import axios from 'axios';

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

  // Use useCallback to memoize fetchMovies
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      const response = searchQuery
        ? await axios.get('https://api.themoviedb.org/3/search/movie', {
            params: {
              api_key: '1ed011566a44232f76b6cdaf845c8eb2', 
              query: searchQuery,
              page: currentPage,
            },
          })
        : await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            params: {
              api_key: '1ed011566a44232f76b6cdaf845c8eb2', 
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
  }, [searchQuery, currentPage]); // Add searchQuery and currentPage as dependencies

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]); // Include fetchMovies in dependency array

  const handleHomeClick = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleMovieClick = async (movie) => {
    setSelectedMovie(movie);
    setShowModal(true);

    try {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
        params: {
          api_key: '1ed011566a44232f76b6cdaf845c8eb2', 
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

  const createPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, currentPage + Math.floor(maxPagesToShow / 2));

    if (endPage - startPage + 1 < maxPagesToShow) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, maxPagesToShow);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxPagesToShow + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
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
      <header>
        <h1>TDMovies</h1>
        <button className="home-button" onClick={handleHomeClick}>
          Home
        </button>
      </header>

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
              &laquo; Previous
            </button>
            {createPageNumbers().map(page => (
              <button
                key={page}
                className={page === currentPage ? 'active' : ''}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next &raquo;
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
          </div>
        </>
      )}

      {selectedMovie && (
        <ReactModal isOpen={showModal} onRequestClose={closeModal} className="modal">
          <h2>{selectedMovie.title}</h2>
          <div className="modal-content">
            <YouTube
              videoId={selectedMovie.trailerId}
              opts={opts}
              className="youtube-video"
            />
            <div className="synopsis">
              <h3>Synopsis</h3>
              <p>{selectedMovie.overview}</p>
              <button 
                className="play-button"
                onClick={() => window.open(`https://vidsrc.xyz/embed/movie?tmdb=${selectedMovie.id}`, '_blank')}
              >
                Play Movie
              </button>
            </div>
          </div>
          <button className="close-button" onClick={closeModal}>Close</button>
        </ReactModal>
      )}

      <footer className="footer">
        <p>&copy; 2024 AtesMovies. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
