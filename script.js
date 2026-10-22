const STORAGE_KEY = "tab-storage-links";

const form = document.querySelector("#link-form");
const urlInput = document.querySelector("#url");
const titleInput = document.querySelector("#title");
const categoryInput = document.querySelector("#category");
const noteInput = document.querySelector("#note");
const searchInput = document.querySelector("#search");

const linkList = document.querySelector("#link-list");
const emptyState = document.querySelector("#empty-state");
const linkCount = document.querySelector("#link-count");
const categoryFilters = document.querySelector("#category-filters");
const formMessage = document.querySelector("#form-message");

let links = loadLinks();
let activeCategory = "All";

function loadLinks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Could not load saved links:", error);
        return [];
    }
}

function saveLinks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function createId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeUrl(value) {
    let url;
    
    try {
        url = new URL(value.trim());
    } catch {
        try {
            url = new URL(`https://${value.trim()}`);
        } catch {
            return null;
        }
    }
    
    if (!["http:", "https:"].includes(url.protocol)) {
        return null;
    }
    
    return url.href;
}

function getDomain(url) {
    try {
        return new URL(url).hostname.replace(/^www\\./, "");
    } catch {
        return url;
    }
}

function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("error", isError);
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    
    const url = normalizeUrl(urlInput.value);
    
    if (!url) {
        showMessage("Enter a valid http or https link.", true);
        urlInput.focus();
        return;
    }
    
    const title = titleInput.value.trim() || getDomain(url);
    const category = categoryInput.value.trim() || "General";
    const note = noteInput.value.trim();
    
    const newLink = {
        id: createId(),
        url,
        title,
        category,
        note,
        createdAt: Date.now()
    };
    
    links.unshift(newLink);
    saveLinks();
    
    form.reset();
    showMessage("Link saved successfully!");
    activeCategory = "All";
    
    render();
    urlInput.focus();
});

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    
    if (className) {
        element.className = className;
    }
    
    if (text !== undefined) {
        element.textContent = text;
    }
    
    return element;
}

function renderLink(link) {
    const card = createElement("article", "link-card");
    
    const content = createElement("div", "link-content");
    const title = createElement("h3");
    const titleLink = createElement("a", "", link.title);
    
    titleLink.href = link.url;
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";
    title.appendChild(titleLink);
    
    const domain = createElement("p", "link-domain", getDomain(link.url));
    const note = createElement("p", "link-note", link.note);
    const category = createElement("span", "link-category", link.category);
    
    content.append(title, domain);
    
    if (link.note) {
        content.appendChild(note);
    }
    
    content.appendChild(category);
    
    const actions = createElement("div", "link-actions");
    const openButton = createElement("a", "open-link", "Open ↗");
    
    openButton.href = link.url;
    openButton.target = "_blank";
    openButton.rel = "noopener noreferrer";
    openButton.setAttribute("aria-label", `Open ${link.title}`);
    
    const deleteButton = createElement("button", "delete-link", "Delete");
    deleteButton.type = "button";
    deleteButton.addEventListener("click", () => {
        links = links.filter((item) => item.id !== link.id);
        saveLinks();
        render();
    });
    
    actions.append(openButton, deleteButton);
    card.append(content, actions);
    
    return card;
}

function renderFilters() {
    const categories = [
        "All",
        ...new Set(links.map((link) => link.category).filter(Boolean))
    ];
    
    categoryFilters.replaceChildren();
    
    categories.forEach((category) => {
        const button = createElement(
                                     "button",
                                     `filter${activeCategory === category ? " active" : ""}`,
                                     category === "All" ? "All links" : category    );
        
        button.type = "button";
        button.dataset.category = category;
        
        button.addEventListener("click", () => {
            activeCategory = category;
            render();
        });
        
        categoryFilters.appendChild(button);
    });
}

function render() {
    const query = searchInput.value.trim().toLowerCase();
    
    const filteredLinks = links.filter((link) => {
        const matchesCategory =
        activeCategory === "All" || link.category === activeCategory;
        
        const searchableText = [
            link.title,
            link.url,
            link.category,
            link.note    ].join(" ").toLowerCase();
        
        return matchesCategory && searchableText.includes(query);
    });
    
    linkList.replaceChildren();
    
    filteredLinks.forEach((link) => {
        linkList.appendChild(renderLink(link));
    });
    
    linkCount.textContent = String(links.length);
    emptyState.hidden = filteredLinks.length > 0;
    
    if (links.length === 0) {
        emptyState.hidden = false;
    }
    
    renderFilters();
}

searchInput.addEventListener("input", render);

render();
