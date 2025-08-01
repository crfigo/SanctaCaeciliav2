import React, { useState, useEffect } from 'react';

// Componente para el contenido de las pestañas de lista (Por escuchar - List, Escuchadas - List)
const ArtistListTabContent = ({ artists, columnHeaders, isLoading, error, displayColumnRange, tabName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [textFilters, setTextFilters] = useState({}); // State para los filtros de texto por columna
  const [dropdownFilters, setDropdownFilters] = useState({}); // Nuevo State para los filtros desplegables
  const [shuffledArtists, setShuffledArtists] = useState([]); // State para los artistas mezclados
  const [selectedArtistDetails, setSelectedArtistDetails] = useState(null); // Estado para el artista seleccionado en la lista
  const [uniqueColumnValues, setUniqueColumnValues] = useState({}); // Estado para almacenar valores únicos para los dropdowns
  const [cellModalContent, setCellModalContent] = useState(null); // Nuevo estado para el contenido del modal de celda
  const itemsPerPage = 10;

  // Determinar los índices de las columnas a mostrar
  const getDisplayColumnIndices = () => {
    const startIndex = 0; // Columna B (índice 1 en data, pero 0 en selectedHeaders)
    let endIndex = 0;

    if (displayColumnRange === 'B-G') {
      endIndex = 5; // Columna G (índice 5 en selectedHeaders)
    } else if (displayColumnRange === 'B-F') {
      endIndex = 4; // Columna F (índice 4 en selectedHeaders)
    }
    return { startIndex, endIndex };
  };

  const { startIndex, endIndex } = getDisplayColumnIndices();
  const displayedColumnHeaders = columnHeaders.slice(startIndex, endIndex + 1);

  // Actualizar shuffledArtists y recolectar valores únicos para dropdowns cuando la prop artists cambie
  useEffect(() => {
    setShuffledArtists([...artists]); // Crear una copia para poder mezclarla

    const newUniqueValues = {};
    displayedColumnHeaders.forEach(header => {
      const values = new Set();
      artists.forEach(artist => {
        if (artist.data[header]) {
          values.add(artist.data[header]);
        }
      });
      newUniqueValues[header] = Array.from(values).sort(); // Convertir a array y ordenar
    });
    setUniqueColumnValues(newUniqueValues);
    setDropdownFilters({}); // Resetear filtros de dropdown al cargar nuevos datos
    setTextFilters({}); // Resetear filtros de texto al cargar nuevos datos
  }, [artists, displayColumnRange, columnHeaders]); // Dependencias para re-calcular cuando cambian los artistas o las columnas a mostrar

  // Filtrar artistas basado en los filtros de texto y desplegables
  const filteredArtists = shuffledArtists.filter(artist => {
    // Aplicar filtros de texto
    for (const header of displayedColumnHeaders) {
      const textFilterValue = textFilters[header] ? textFilters[header].toLowerCase() : '';
      if (textFilterValue) {
        if (!artist.data[header] || !artist.data[header].toLowerCase().includes(textFilterValue)) {
          return false;
        }
      }
    }

    // Aplicar filtros desplegables
    for (const header of displayedColumnHeaders) {
      const dropdownFilterValue = dropdownFilters[header];
      if (dropdownFilterValue && dropdownFilterValue !== 'All') { // Si hay un filtro seleccionado (no "All")
        if (artist.data[header] !== dropdownFilterValue) {
          return false;
        }
      }
    }
    return true; // Coincide con todos los filtros activos
  });

  // Paginación
  const totalPages = Math.ceil(filteredArtists.length / itemsPerPage);
  const indexOfLastArtist = currentPage * itemsPerPage;
  const indexOfFirstArtist = indexOfLastArtist - itemsPerPage;
  const currentArtists = filteredArtists.slice(indexOfFirstArtist, indexOfLastArtist);

  // Resetear página cuando cambian los filtros (texto o dropdown) o los artistas
  useEffect(() => {
    setCurrentPage(1);
  }, [textFilters, dropdownFilters, shuffledArtists]);

  // Manejar el cambio en los inputs de filtro de texto
  const handleTextFilterChange = (header, value) => {
    setTextFilters(prev => ({
      ...prev,
      [header]: value
    }));
  };

  // Manejar el cambio en los dropdowns de filtro
  const handleDropdownFilterChange = (header, value) => {
    setDropdownFilters(prev => ({
      ...prev,
      [header]: value
    }));
  };

  // Helper function to check if a value is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Función para mezclar un array (algoritmo de Fisher-Yates)
  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  // Función para mezclar los artistas actuales
  const shuffleCurrentArtists = () => {
    const artistsToShuffle = [...shuffledArtists]; // Copia superficial para no mutar el estado directamente
    const newShuffledArtists = shuffleArray(artistsToShuffle);
    setShuffledArtists(newShuffledArtists);
    setCurrentPage(1); // Resetear a la primera página después de mezclar
  };

  // Función para abrir el modal de detalles de celda
  const openCellModal = (content) => {
    setCellModalContent(content);
  };

  // Función para cerrar el modal de detalles de celda
  const closeCellModal = () => {
    setCellModalContent(null);
  };

  // Definir las cabeceras que deben ser tratadas como URLs (columnas H a N, que son las últimas 7 de B a N)
  const urlHeaders = new Set(columnHeaders.slice(6, 13));

  return (
    <div className="mt-6">
      {isLoading ? (
        <div className="text-center text-gray-300">Cargando artistas...</div>
      ) : error ? (
        <div className="mt-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg" role="alert">
          <p className="font-bold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            {/* Botón Shuffle */}
            <button
              onClick={shuffleCurrentArtists}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={shuffledArtists.length === 0}
            >
              Shuffle
            </button>
          </div>

          {/* Tabla de artistas */}
          {filteredArtists.length > 0 ? (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    {displayedColumnHeaders.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-4 py-2 text-left text-xs sm:px-6 sm:py-3 sm:text-sm font-medium text-gray-300 uppercase tracking-wider min-w-[80px]" // Adjusted padding and font size for mobile
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {displayedColumnHeaders.map((header, index) => (
                      <th key={`filter-text-${index}`} className="px-4 py-1 text-left sm:px-6 sm:py-2"> {/* Adjusted padding */}
                        <input
                          type="text"
                          placeholder={`Filtrar...`}
                          className="w-full py-1 px-2 text-xs bg-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={textFilters[header] || ''}
                          onChange={(e) => handleTextFilterChange(header, e.target.value)}
                        />
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {displayedColumnHeaders.map((header, index) => (
                      <th key={`filter-dropdown-${index}`} className="px-4 py-1 text-left sm:px-6 sm:py-2"> {/* Adjusted padding */}
                        <select
                          className="w-full py-1 px-2 text-xs bg-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={dropdownFilters[header] || 'All'}
                          onChange={(e) => handleDropdownFilterChange(header, e.target.value)}
                        >
                          <option value="All">Todos</option>
                          {uniqueColumnValues[header] && uniqueColumnValues[header].map((value, i) => (
                            <option key={i} value={value}>{value}</option>
                          ))}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {currentArtists.map((artist, rowIndex) => (
                    <tr key={rowIndex}>
                      {displayedColumnHeaders.map((header, colIndex) => (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className="px-4 py-2 whitespace-nowrap text-xs sm:px-6 sm:py-4 sm:text-sm text-gray-200 overflow-hidden text-ellipsis cursor-pointer" // Added overflow-hidden, text-ellipsis, cursor-pointer
                          onClick={() => {
                            if (colIndex === 0) { // Si es la primera columna (nombre del artista)
                              setSelectedArtistDetails(artist);
                            } else { // Para otras columnas, abrir modal de contenido de celda
                              openCellModal(artist.data[header]);
                            }
                          }}
                        >
                          {urlHeaders.has(header) && isValidUrl(artist.data[header]) ? (
                            <a href={artist.data[header]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                              {artist.data[header]}
                            </a>
                          ) : (
                            artist.data[header]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-300 mt-4">No se encontraron artistas que coincidan con la búsqueda.</p>
          )}


          {/* Controles de paginación */}
          {filteredArtists.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm" // Adjusted font size
              >
                Anterior
              </button>
              <span className="text-gray-300 text-sm">Página {currentPage} de {totalPages}</span> {/* Adjusted font size */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm" // Adjusted font size
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de detalles del artista */}
      {selectedArtistDetails && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4"> {/* Added p-4 for padding on small screens */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md mx-auto relative"> {/* Changed mx-4 to mx-auto for better centering */}
            <h3 className="text-2xl font-bold text-gray-100 mb-4 text-center">
              {selectedArtistDetails.name}
            </h3>
            <h4 className="text-xl font-bold text-gray-200 mb-2">Detalles Completos:</h4>
            <ul className="list-disc list-inside text-gray-300 max-h-80 overflow-y-auto pr-2"> {/* Added max-height and overflow for scroll */}
              {Object.entries(selectedArtistDetails.data).map(([key, value]) => (
                <li key={key} className="mb-1">
                  <span className="font-semibold text-gray-200">{key}:</span>{' '}
                  {urlHeaders.has(key) && isValidUrl(value) ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setSelectedArtistDetails(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo Modal para el contenido de la celda */}
      {cellModalContent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm mx-auto relative">
            <h3 className="text-xl font-bold text-gray-100 mb-4">Contenido de la Celda</h3>
            <p className="text-gray-300 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{cellModalContent}</p>
            <div className="flex justify-center mt-6">
              <button
                onClick={closeCellModal}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Main App component
const App = () => {
  // State for the currently active tab
  const [activeTab, setActiveTab] = useState('porEscucharRandom'); // Changed initial active tab name

  // State to store data for each tab
  const [tabData, setTabData] = useState({
    porEscucharRandom: { // Renamed key for consistency
      url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSGpNMHvwKugDUe7EvNvQVIBEBg7RdgHEpcWlUuOQlE5oBF0b61Ql-HN35dWfewWlR7gftloGshufJ-/pub?gid=0&single=true&output=csv', // Provided URL for "Por escuchar"
      artists: [],
      randomArtist: null, // Will persist the last selected artist for this tab
      columnHeaders: [],
      isLoading: false,
      error: '',
    },
    escuchadasRandom: { // Renamed key for consistency
      url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSGpNMHvwKugDUe7EvNvQVIBEBg7RdgHEpcWlUuOQlE5oBF0b61Ql-HN35dWfewWlR7gftloGshufJ-/pub?gid=832295915&single=true&output=csv', // Provided URL for "Escuchadas"
      artists: [],
      randomArtist: null, // Will persist the last selected artist for this tab
      columnHeaders: [],
      isLoading: false,
      error: '',
    },
    porEscucharList: { // New tab data
      url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSGpNMHvwKugDUe7EvNvQVIBEBg7RdgHEpcWlUuOQlE5oBF0b61Ql-HN35dWfewWlR7gftloGshufJ-/pub?gid=0&single=true&output=csv', // Same URL as porEscucharRandom
      artists: [],
      randomArtist: null, // Not used for list, but kept for consistent structure
      columnHeaders: [],
      isLoading: false,
      error: '',
    },
    escuchadasList: { // New tab data
      url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSGpNMHvwKugDUe7EvNvQVIBEBg7RdgHEpcWlUuOQlE5oBF0b61Ql-HN35dWfewWlR7gftloGshufJ-/pub?gid=832295915&single=true&output=csv', // Same URL as escuchadasRandom
      artists: [],
      randomArtist: null, // Not used for list, but kept for consistent structure
      columnHeaders: [],
      isLoading: false,
      error: '',
    },
    data: {
      url: '', // This tab is a placeholder for now, no URL needed
    }
  });

  // State to control the visibility of the custom alert modal
  const [showAlert, setShowAlert] = useState(false);
  // State to store the alert message
  const [alertMessage, setAlertMessage] = useState('');


  // Function to show a custom alert message
  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  // Function to hide the custom alert message
  const hideCustomAlert = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  // Helper function to get current tab's data
  const getCurrentTabData = () => tabData[activeTab];

  // Function to fetch and parse the CSV data for a specific tab
  const fetchArtistsForTab = async (tabKey) => {
    const tabToUpdate = tabData[tabKey];

    // Only proceed if not already loading and URL is valid
    if (tabToUpdate.isLoading || !tabToUpdate.url || tabToUpdate.url.includes('YOUR_')) {
      if (!tabToUpdate.url || tabToUpdate.url.includes('YOUR_')) {
        // Show alert only if it's a placeholder URL, not for every background fetch
        if (!tabToUpdate.isLoading) { // Avoid multiple alerts if already trying to load
          showCustomAlert(`No CSV URL provided or URL is a placeholder for the "${tabKey}" tab. Please ensure it's set in the code.`);
        }
      }
      return;
    }

    // Set loading state for the specific tab, but do NOT reset randomArtist
    setTabData(prev => ({
      ...prev,
      [tabKey]: { ...prev[tabKey], isLoading: true, error: '', artists: [], columnHeaders: [] }
    }));

    const csvUrl = tabToUpdate.url;

    try {
      const response = await fetch(csvUrl);

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}. This might mean the sheet is not publicly accessible for CSV export.`);
      }

      const csvText = await response.text(); // Get the CSV text
      const lines = csvText.split('\n').filter(line => line.trim() !== ''); // Split into lines and filter empty ones

      if (lines.length < 6) { // Need at least 6 lines (1-5 for headers, 6 for first data row)
        showCustomAlert(`Not enough data in the spreadsheet for "${tabKey}". Ensure you have at least 6 rows (including headers on row 5).`);
        setTabData(prev => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], isLoading: false }
        }));
        return;
      }

      // Extract headers from the 5th line (index 4 in a 0-indexed array)
      const headerLine = lines[4];
      // Split headers by comma, trim whitespace, and get columns from B (index 1) to N (index 13)
      const rawHeaders = headerLine.split(',').map(header => header.trim());
      const selectedHeaders = rawHeaders.slice(1, 14); // Columns B to N (index 1 to 13)

      // Parse artist data starting from the 6th line (index 5)
      const parsedArtists = [];
      for (let i = 5; i < lines.length; i++) {
        const dataLine = lines[i];
        const columns = dataLine.split(',').map(col => col.trim()); // Split by comma and trim each column

        // Ensure the line has enough columns for column B (index 1)
        if (columns.length > 1) {
          const artistName = columns[1]; // Artist name is in column B (index 1)

          if (artistName) { // Only add if artist name is not empty
            const artistData = {};
            // Collect data for columns B to N
            for (let j = 1; j <= 13; j++) { // Iterate from column B (index 1) to N (index 13)
              if (selectedHeaders[j - 1] && columns[j]) { // Check if header exists and column data exists
                artistData[selectedHeaders[j - 1]] = columns[j];
              } else if (selectedHeaders[j - 1]) { // If header exists but data is empty
                artistData[selectedHeaders[j - 1]] = ''; // Assign empty string
              }
            }
            parsedArtists.push({ name: artistName, data: artistData });
          }
        }
      }

      if (parsedArtists.length === 0) {
        showCustomAlert(`No valid artist entries found starting from row 6 for "${tabKey}". Please ensure column B contains artist names.`);
        setTabData(prev => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], isLoading: false }
        }));
        return;
      }

      setTabData(prev => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], artists: parsedArtists, columnHeaders: selectedHeaders, isLoading: false }
      }));
      // Removed the success notification as per user request
    } catch (e) {
      setTabData(prev => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], error: `Failed to load artists for "${tabKey}": ${e.message}. Please ensure the sheet is published for CSV export and the URL in the code is correct.`, isLoading: false }
      }));
      showCustomAlert(`Error loading data for "${tabKey}": ${e.message}. Check console for details.`);
      console.error(`Error fetching artists for ${tabKey}:`, e);
    }
  };

  // UseEffect for initial load and automatic refresh every 15 minutes
  useEffect(() => {
    // Initial load for all relevant tabs when the component mounts
    fetchArtistsForTab('porEscucharRandom');
    fetchArtistsForTab('escuchadasRandom');
    fetchArtistsForTab('porEscucharList');
    fetchArtistsForTab('escuchadasList');

    // Set up interval to refresh data for all relevant tabs every 15 minutes (900,000 ms)
    const intervalId = setInterval(() => {
      fetchArtistsForTab('porEscucharRandom');
      fetchArtistsForTab('escuchadasRandom');
      fetchArtistsForTab('porEscucharList');
      fetchArtistsForTab('escuchadasList');
    }, 900000); // 15 minutes = 900000 milliseconds

    // Cleanup interval on component unmount to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Function to pick a random artist from the loaded list for the current tab
  const pickRandomArtist = () => {
    const currentTab = tabData[activeTab]; // Get current tab data
    if (currentTab.artists.length === 0) {
      showCustomAlert('Please load artists first for this tab.');
      return;
    }
    const randomIndex = Math.floor(Math.random() * currentTab.artists.length); // Get a random index
    // Update only the randomArtist for the current tab
    setTabData(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], randomArtist: currentTab.artists[randomIndex] }
    }));
  };


  // Helper function to check if a value is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Render content based on the active tab
  const renderTabContent = () => {
    const currentTab = getCurrentTabData(); // Get current tab data

    // Define the headers that should be treated as URLs (last 7 columns from B to N)
    // These correspond to indices 6 through 12 of the selectedHeaders array (H to N)
    const urlHeaders = new Set(currentTab.columnHeaders.slice(6, 13));

    if (activeTab === 'data') {
      return (
        <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-lg text-center">
          <p className="text-lg text-gray-300">
            This tab is for "Data" and is currently a placeholder.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Future functionality can be added here.
          </p>
        </div>
      );
    } else if (activeTab === 'porEscucharList') {
      return (
        <ArtistListTabContent
          artists={currentTab.artists}
          columnHeaders={currentTab.columnHeaders}
          isLoading={currentTab.isLoading}
          error={currentTab.error}
          displayColumnRange="B-G"
          tabName="Por escuchar - List"
        />
      );
    } else if (activeTab === 'escuchadasList') {
      return (
        <ArtistListTabContent
          artists={currentTab.artists}
          columnHeaders={currentTab.columnHeaders}
          isLoading={currentTab.isLoading}
          error={currentTab.error}
          displayColumnRange="B-F"
          tabName="Escuchadas - List"
        />
      );
    }

    // Default content for "Random" tabs
    return (
      <>
        <div className="flex flex-col space-y-3 mb-6">
          <button
            onClick={pickRandomArtist}
            className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentTab.artists.length === 0 || currentTab.isLoading}
          >
            Randomize! {/* Changed button text */}
          </button>
        </div>

        {/* Display Area for Random Artist and their details */}
        {currentTab.randomArtist && ( // Display randomArtist if it exists for the current tab
          <div className="mt-6 p-4 bg-blue-900 border border-blue-700 rounded-lg text-left">
            <p className="text-lg text-gray-100 mb-2">Your random artist is:</p>
            <p className="text-2xl font-semibold text-blue-400 mb-4">
              {currentTab.randomArtist.name}
            </p>
            <h3 className="text-xl font-bold text-gray-100 mb-2">Details:</h3>
            <ul className="list-disc list-inside text-gray-300">
              {Object.entries(currentTab.randomArtist.data).map(([key, value]) => (
                <li key={key} className="mb-1">
                  <span className="font-semibold">{key}:</span>{' '}
                  {urlHeaders.has(key) && isValidUrl(value) ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Message Display */}
        {currentTab.error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg" role="alert">
            <p className="font-bold">Error:</p>
            <p className="text-sm">{currentTab.error}</p>
          </div>
        )}
      </>
    );
  };

  const currentTab = getCurrentTabData(); // Get current tab data for the bubble

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-full relative">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-6">
          Sancta Caecilia v2 {/* Changed app title */}
        </h1>

        {/* Artist Count Bubble */}
        {activeTab !== 'data' && ( // Only show bubble for artist tabs
          <div className="fixed top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-50">
            Artists: {currentTab.artists.length}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 border-b border-gray-700">
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'porEscucharRandom' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('porEscucharRandom')}
          >
            Por escuchar - Random {/* Changed tab name */}
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'porEscucharList' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('porEscucharList')}
          >
            Por escuchar - List {/* New tab name */}
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'escuchadasRandom' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('escuchadasRandom')}
          >
            Escuchadas - Random {/* Changed tab name */}
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'escuchadasList' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('escuchadasList')}
          >
            Escuchadas - List {/* New tab name */}
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'data' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
        </div>

        {/* Render content based on active tab */}
        {renderTabContent()}

        {/* Custom Alert Modal */}
        {showAlert && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-700 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-gray-100 mb-4">Notification</h3>
              <p className="text-gray-300 mb-6">{alertMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={hideCustomAlert}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
