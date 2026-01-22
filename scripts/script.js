// I. Main functions

/**
 * Fetches and displays best movie data from API
 * @async
 * @returns {void} Modifies .bestMovie img, h2 and .bestMovieContent p
 */
async function displayBestFilmData() {
    let bestFilmsArray = await fetchData("http://localhost:8000/api/v1/titles/?sort_by=-imdb_score");
    let bestFilm = bestFilmsArray.results[0];

    document.querySelector("div h2").textContent = bestFilm.title;

    const imageElement = document.querySelector(".bestMovie img");
    verifyImage(imageElement, bestFilm)

    let bestFilmRessource = await fetchData(`http://localhost:8000/api/v1/titles/${bestFilm.id}`);
    document.querySelector(".bestMovieContent p").textContent = bestFilmRessource.description;
}

/**
 * Fetches and displays top rated films datas from API
 * @async
 * @returns {void} Modifies all .top-rated-films img and h3
 */
async function displayBestRatedFilmsData() {
    let topRatedFilmsArray = await fetchMultiplePagesData("http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&page=", 3);
    topRatedFilmsArray = topRatedFilmsArray.slice(1, 7);

    const titleElements = document.querySelectorAll("#top-rated-films h3");
    for (let i = 0; i < topRatedFilmsArray.length; i++){
       titleElements[i].textContent = topRatedFilmsArray[i].title
    }
    
    const imageElements = document.querySelectorAll("#top-rated-films img");
    for (let i = 0; i < topRatedFilmsArray.length; i++) {
        verifyImage(imageElements[i], topRatedFilmsArray[i])
    }
}

/**
 * Fetches and displays top genre films datas from API
 * @async
 * @param {string} genreChosen Film genre chooser
 * @param {string} id  HTML's ID to replace
 * @returns {void} Modifies film datas for category choosen
 */
async function displayBestFilmByGenreData(genreChosen, id) {
    let bestFilmCategoryArray = await fetchMultiplePagesData(`http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&genre=${genreChosen}&page=`, 3);
    bestFilmCategoryArray = bestFilmCategoryArray.slice(0, 6);

    // Translated Genre Title for category 1 and 2
    const GenreTraducted = getTranslatedGenre(genreChosen)
    const GenreTitle = document.querySelector(`${id} h2`)
    if (GenreTitle) GenreTitle.textContent = GenreTraducted;

    const titleElements = document.querySelectorAll(`${id} h3`)
    for (let i = 0; i < bestFilmCategoryArray.length; i++){
       titleElements[i].textContent = bestFilmCategoryArray[i].title;
    }

    const imageElements = document.querySelectorAll(`${id} img`)
    for (let i = 0; i < bestFilmCategoryArray.length; i++) {
        verifyImage(imageElements[i], bestFilmCategoryArray[i])
    }
}

/**
 * Handles dynamic film display based on selected genre
 * - Loads available genres list via getAllGenreList()
 * - Listens for changes on #genre dropdown element
 * - On change event, triggers displayBestFilmByGenreData() with selected value
 * @async
 * @function displayUserChoiceGenreData
 * @returns {void>} Modifies film datas for category choosen
 */
async function displayUserChoiceGenreData(){
    getAllGenreList()
    let userChoiceGenre = document.getElementById("genre")
    userChoiceGenre.addEventListener("change", () => {
        displayBestFilmByGenreData(userChoiceGenre.value, "#user-choice-film-category")
    })
}


// II. Utility functions

/**
 * Performs HTTP request with silent error handling
 * @async
 * @param {string} endpoint - API URL to query
 * @returns {Promise<Object|null>} Parsed JSON or null on failure
 */
async function fetchData(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Fetch failed:", error.message);
        return null;
    }
}

/**
 * Performs concurrent HTTP requests across multiple paginated endpoints
 * @async
 * @param {string} endpoint - Base API URL (page number will be appended)
 * @param {number} maxPage - Maximum page number to fetch
 * @returns {Array} Combined results from all requested pages
 */
async function fetchMultiplePagesData(endpoint, maxPage) {
    let allDataArray = [];
    let currentPage = 1;
    let pageData;
    while (currentPage < maxPage && (pageData = await fetchData(`${endpoint}${currentPage}`))) {
        if (!pageData?.results) break;
        allDataArray.push(...pageData.results);
        if (!pageData.next) break;
        currentPage++;
    }
    return allDataArray
}

/**
 * Fetches and displays all genre list from API to HTML form
 * @async
 * @returns {void} Modifies all options form options 
 */
async function getAllGenreList() {
    let allGenreArray = await fetchMultiplePagesData("http://localhost:8000/api/v1/genres/?page=", 10)
    let parentElement = document.getElementById("genre")
    parentElement.innerHTML = '';

    for (let genre of allGenreArray) {
        let newOption = document.createElement("option");
        let translatedGenre = getTranslatedGenre(genre.name)
        newOption.value = genre.name;
        newOption.textContent = translatedGenre;
        parentElement.appendChild(newOption);
    }
}


// III. Helpers

/**
 * Translate the film genre from English to French
 * @returns {string} The translation or fallback in English if no translation found
 */
function getTranslatedGenre(englishName) {
  return genreTranslations[englishName] || englishName;
}

/**
 * Checks image URL validity and updates DOM element
 * @async
 * @param {HTMLElement} imageElement - The img tag to modify
 * @param {Object} endpoint - API response object containing image_url
 * @returns {void}
 */
async function verifyImage(imageElement, endpoint){
    const testImage = new Image();
    testImage.onload = () => {
    imageElement.src = endpoint.image_url;
    };
    testImage.onerror = () => {
    imageElement.src = "images/no-img.png"; 
    };
    testImage.src = endpoint.image_url;
}


function createFilmCard(filmData) {
    const card = document.createElement('div');
    card.className = 'film-card';
    card.innerHTML = `
        <img src="" alt="Affiche de ${filmData.title}">
        <div class="film-details">
            <h3></h3>
            <a href="modal-window.html">Détails</a>
        </div>
    `;
    return card;
}