// I. Main functions

/**
 * Fetches and displays best movie data from API (makes two API calls)
 * @async
 * @returns {void} Modifies film data for the best film
 */
async function manageBestFilm() {
    const bestFilmsArray = await fetchData("http://localhost:8000/api/v1/titles/?sort_by=-imdb_score");
    const bestFilm = bestFilmsArray.results[0];

    document.querySelector("div h2").textContent = bestFilm.title;

    const imageElement = document.querySelector(".bestFilm img");
    verifyImage(imageElement, bestFilm)
    imageElement.alt = `Affiche de ${bestFilm.title}`;

    const bestFilmData = await fetchData(`http://localhost:8000/api/v1/titles/${bestFilm.id}`);
    document.querySelector(".bestFilmContent p").textContent = bestFilmData.description;

    const detailsButton = document.querySelector(".bestFilm button");
    detailsButton.setAttribute("id", bestFilm.id);
}

/**
 * Fetches and displays top rated films datas from API
 * @async
 * @returns {void} Modifies films data for top rated films
 */
async function manageTopRatedFilms() {
    let topRatedFilmsArray = await fetchMultiplePagesData("http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&page=", 3);
    topRatedFilmsArray = topRatedFilmsArray.slice(1, 7);

    displayFilmData("#top-rated-films", topRatedFilmsArray);
}

/**
 * Fetches and displays top genre films datas from API
 * @async
 * @param {string} genreChosen Film genre chooser
 * @param {string} id  HTML's ID to replace
 * @returns {void} Modifies film datas for category choosen
 */
async function manageTopRatedFilmsByGenre(genreChosen, id) {
    let bestFilmCategoryArray = await fetchMultiplePagesData(`http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&genre=${genreChosen}&page=`, 3);
    bestFilmCategoryArray = bestFilmCategoryArray.slice(0, 6);

    // Translated Genre Title for category 1 and 2
    const GenreTraducted = getTranslatedGenre(genreChosen)
    const GenreTitle = document.querySelector(`${id} h2`)
    if (GenreTitle) {
        GenreTitle.textContent = GenreTraducted;
    }

    refreshFilmContainer(id, bestFilmCategoryArray)
    displayFilmData(id, bestFilmCategoryArray)
}

/**
 * Handles dynamic film display based on selected genre
 * - Loads available genres list via getAllGenreList()
 * - Listens for changes on #genre dropdown element
 * - On change event, triggers displayBestFilmByGenreData() with selected value
 * @async
 * @returns {void>} Modifies film datas for category choosen
 */
async function manageUserChoiceGenre(){
    manageTopRatedFilmsByGenre("action", "#user-choice-film-category")
    getAllGenreList()
    let userChoiceGenre = document.getElementById("genre");
    userChoiceGenre.addEventListener("change", () => {
        manageTopRatedFilmsByGenre(userChoiceGenre.value, "#user-choice-film-category")
    })
}

/**
 * Handles modal button click events
 * - Listens for clicks on '.open-modal-button' elements
 * - Fetches film data by ID from API
 * - Displays modal with populated film data
 * @async
 */
async function manageModalWindow(){
    const modalWindow = document.getElementById("modal-window");
    document.addEventListener("click", async (e) => {
        if (e.target.matches(".open-modal-button")) {
            const filmId = e.target.id;
            const filmData = await fetchData(`http://localhost:8000/api/v1/titles/${filmId}`);
            modalWindow.showModal();
            window.scrollTo(0, 0);
            displayModalWindowData(filmData);
        }
    });

    const closeModalButton = document.querySelector(".close-modal-button");
    closeModalButton.addEventListener("click", () =>{
        modalWindow.close();
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
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
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
        if (!pageData?.results) {
            break;
        }
        allDataArray.push(...pageData.results);
        if (!pageData.next) {
            break;
        }
        currentPage++;
    }
    return allDataArray
}

/**
 * Populates film cards with data
 * @param {string} cssSelector - Container selector for cards
 * @param {Array} filmsArray - Films data to display
 */
function displayFilmData(cssSelector, filmsArray) {
    const titleElements = document.querySelectorAll(`${cssSelector} h3`);
    const imageElements = document.querySelectorAll(`${cssSelector} img`);
    for (let i = 0; i < filmsArray.length; i++){
       titleElements[i].textContent = filmsArray[i].title;
       verifyImage(imageElements[i], filmsArray[i])
       imageElements[i].alt = `Affiche de ${filmsArray[i].title}`;

       const detailsButtons = document.querySelectorAll(`${cssSelector} .open-modal-button`);
       detailsButtons[i].id = filmsArray[i].id;
    }
}

/**
 * Renders film data in modal window
 * - Updates title, image and all metadata fields
 * - Handles missing data gracefully
 * @param {Object} filmData - Complete film data from API
 */
function displayModalWindowData(filmData) {
  
    const imageElement = document.querySelector("#modal-window img");
    verifyImage(imageElement, filmData)
    document.querySelector("#modal-window img").alt = `Affiche de ${filmData.original_title}`;

    document.querySelector("#modal-film-details").innerHTML = `
        <div class="film-info">
            <span class="film-title">${filmData.original_title}</br></span>
            ${filmData.year} - ${filmData.genres.join(", ")}<br>
            ${filmData.rated} - ${filmData.duration} minutes (${filmData.countries.join(" / ")})<br>
            IMDB score: ${filmData.imdb_score}/10<br>
            Recette au box-office: ${filmData.worldwide_gross_income ? `$${filmData.worldwide_gross_income.toLocaleString()}` : "Non disponible"}<br>
        </div>
        <div class="film-director">
        <span class="modal-labels">Réalisé par:</br></span>
        ${filmData.directors.join(", ")}
        </div> 
    `;

    document.querySelector(".film-synopsis").innerText = filmData.long_description;

    document.querySelector(".film-actors").innerHTML = `
        <span class="modal-labels">Avec:<br></span>
        ${filmData.actors.join(", ")}
    `;
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
        let translatedGenre = getTranslatedGenre(genre.name);
        newOption.value = genre.name;
        newOption.textContent = translatedGenre;
        parentElement.appendChild(newOption);
    }
}

/**
 * Clears and repopulates film container with empty cards
 * @param {string} id - CSS selector for parent container
 * @param {Array} films - Array of films (length determines card count)
 */
function refreshFilmContainer(id, films) {
    const container = document.querySelector(`${id} .films-container`);
    container.innerHTML = '';
    for (let i = 0; i < films.length; i++){
        let filmCards = createFilmCard();
        container.appendChild(filmCards);
    }
}

/**
 * Toggles film container height and button visibility for responsive behavior.
 * - Expands container and shows 'Show Less' button when 'Show More' clicked
 * - Collapses container and shows 'Show More' button when 'Show Less' clicked
 */
function responsiveControls() {
    const showMoreButton = document.querySelectorAll(".show-more-button");
    const showLessButton = document.querySelectorAll(".show-less-button");
    const filmContainer = document.querySelectorAll(".films-container");
    for (let i = 0; i < showMoreButton.length; i++){
        showMoreButton[i].addEventListener("click", () => {
            filmContainer[i].style.setProperty("height", "unset");
            filmContainer[i].style.setProperty("overflow", "unset");
            showMoreButton[i].style.setProperty("display", "none");
            showLessButton[i].style.setProperty("display", "block");
        })
    }
    for (let i = 0; i < showLessButton.length; i++){
        showLessButton[i].addEventListener("click", () => {
            filmContainer[i].removeAttribute('style');
            showMoreButton[i].style.setProperty("display", "block");
            showLessButton[i].style.setProperty("display", "none");
        })
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

/**
 * Creates an empty movie card template
 * @returns {HTMLDivElement} The basic HTML structure of a card
 */
function createFilmCard() {
    const card = document.createElement('div');
    card.className = 'film-card';
    card.innerHTML = `
        <img src="" alt="Affiche du film">
        <div class="film-details">
            <h3></h3>
            <button class="open-modal-button">Détails</button>
        </div>
    `;
    return card;
}