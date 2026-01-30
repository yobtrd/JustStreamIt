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
    checkAndLoadImage(imageElement, bestFilm);
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
    let topRatedFilmsArray = await fetchData("http://localhost:8000/api/v1/titles/?page_size=7&sort_by=-imdb_score");
    topRatedFilmsArray = topRatedFilmsArray.results.slice(1, 7);

    const container = document.querySelector("#top-rated-films .films-container");
    container.innerHTML = "";
    container.appendChild(generateFilmCards(topRatedFilmsArray));
}

/**
 * Fetches and displays top genre films datas from API
 * @async
 * @param {string} genreChosen Film genre chooser
 * @param {string} id  HTML's ID to replace
 * @returns {void} Modifies film datas for category choosen
 */
async function manageTopRatedFilmsByGenre(genreChosen, id) {
    let bestFilmCategoryArray = await fetchData(`http://localhost:8000/api/v1/titles/?page_size=6&sort_by=-imdb_score&genre=${genreChosen}`);

    // Translated Genre Title for genre category 1 and 2
    const GenreTraducted = getTranslatedGenre(genreChosen);
    const GenreTitle = document.querySelector(`${id} h2`);
    if (GenreTitle) {
        GenreTitle.textContent = GenreTraducted;
    }

    const container = document.querySelector(`${id} .films-container`);
    container.innerHTML = "";
    container.appendChild(generateFilmCards(bestFilmCategoryArray.results));

}

/**
 * Handles dynamic film display based on selected genre
 * - Loads available genres list via getAllGenreList()
 * - Listens for changes on #genre dropdown element
 * - On change event, triggers displayBestFilmByGenreData() with selected value
 * @async
 * @returns {void>} Modifies film datas for category choosen
 */
async function manageUserChoiceGenre() {
    manageTopRatedFilmsByGenre("action", "#user-choice-film-category");
    getAllGenreList();
    let userChoiceGenre = document.getElementById("genre");
    userChoiceGenre.addEventListener("change", () => {
        manageTopRatedFilmsByGenre(userChoiceGenre.value, "#user-choice-film-category");
        userChoiceGenre.focus({
            preventScroll: true
        });
    })
}

/**
 * Handles modal button click events
 * - Listens for clicks on ".open-modal-button" elements
 * - Fetches film data by ID from API
 * - Displays modal with populated film data
 * @async
 */
async function manageModalWindow() {
    const modalWindow = document.getElementById("modal-window");
    document.addEventListener("click", async (e) => {
        if (e.target.matches(".open-modal-button")) {
            const filmId = e.target.id;
            const filmData = await fetchData(`http://localhost:8000/api/v1/titles/${filmId}`);
            modalWindow.showModal();
            modalWindow.scrollTop = 0;
            displayModalWindowData(filmData);
        }
    });

    const closeModalButton = document.querySelector(".close-modal-button");
    closeModalButton.addEventListener("click", () => {
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
 * Generates complete film cards with populated data in a single pass
 * @param {Array<Object>} filmsData - Array of film objects containing title, id, etc.
 * @returns {DocumentFragment} Lightweight DOM fragment containing all generated cards
 */
function generateFilmCards(filmsData) {
    const fragment = document.createDocumentFragment();

    filmsData.forEach(film => {
        const card = document.createElement("div");
        card.className = "film-card";
        card.innerHTML = `
        <img src="" alt="Affiche de ${film.title}">
        
        <div class="film-details">
            <h3>${film.title}</h3>
            <button class="open-modal-button" id="${film.id}">Détails</button>
        </div>
        `;

        const imageElement = card.querySelector("img");
        checkAndLoadImage(imageElement, film);

        fragment.appendChild(card);
    });

    return fragment;
}

/**
 * Renders film data in modal window
 * - Updates title, image and all metadata fields
 * - Handles missing data gracefully
 * @param {Object} filmData - Complete film data from API
 */
function displayModalWindowData(filmData) {

    const imageElement = document.querySelector("#modal-window img");
    checkAndLoadImage(imageElement, filmData);
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
    let allGenreArray = await fetchData("http://localhost:8000/api/v1/genres/?page_size=50");
    let parentElement = document.getElementById("genre");
    parentElement.innerHTML = "";

    for (let genre of allGenreArray.results) {
        let newOption = document.createElement("option");
        let translatedGenre = getTranslatedGenre(genre.name);
        newOption.value = genre.name;
        newOption.textContent = translatedGenre;
        parentElement.appendChild(newOption);
    }
}

/**
 * Toggles film container height and button visibility for responsive behavior.
 * - Expands container and shows "Show Less" button when "Show More" clicked
 * - Collapses container and shows "Show More" button when "Show Less" clicked
 */
function manageResponsiveControls() {
    document.addEventListener("click", (e) => {
        if (!e.target.matches(".show-more-button, .show-less-button")) return;

        const responsiveButtons = e.target.closest(".responsive-buttons");
        const container = responsiveButtons.previousElementSibling;
        const [showMoreButton, showLessButton] = responsiveButtons.children;

        if (e.target === showMoreButton) {
            container.style.height = "unset";
            container.style.overflow = "unset";
            showMoreButton.style.display = "none";
            showLessButton.style.display = "block";
        } else {
            container.style.height = "";
            container.style.overflow = "";
            showMoreButton.style.display = "block";
            showLessButton.style.display = "none";
        }
    });
}

/**
 * Checks image URL validity and updates DOM element
 * @async
 * @param {HTMLElement} imageElement - The img tag to modify
 * @param {Object} endpoint - API response object containing image_url
 * @returns {void}
 */
async function checkAndLoadImage(imageElement, endpoint) {
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
 * Translate the film genre from English to French
 * @returns {string} The translation or fallback in English if no translation found
 */
function getTranslatedGenre(englishName) {
    return genreTranslations[englishName] || englishName;
}
