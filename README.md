# African Kingdoms Atlas

An interactive, map-based timeline of pre-colonial African kingdoms and empires from **500 CE to 1850 CE**, built as a digital companion to the Academia paper *African Time: A Dialogue on Time and Knowledge in African Thought*.

**Companion paper:** [African Time: A Dialogue on Time and Knowledge in African Thought](https://www.academia.edu/144889366/African_Time_A_Dialogue_on_Time_and_Knowledge_in_African_Thought) (Academia.edu)

The atlas traces the rise, peak, and decline of **47 major states and empires** across the continent, with **approximate peak-extent territory polygons** for 16 empires and **12 trade routes** spanning trans-Saharan, Red Sea, Indian Ocean, and Atlantic networks.

## Live site

Published via GitHub Pages:

```
https://afrigino.github.io/african-time-atlas/
```

## Features

- **Interactive map** (Leaflet.js) with 47 state nodes across 8 regions
- **Timeline slider** (500–1850 CE) with an Animate mode — states appear only when active in the selected year, and swell with a "PEAK" glow during their golden age
- **Territory polygons** showing each major empire's approximate peak extent (clearly labeled approximate; click to open details)
- **Trade routes** that fade in and out with their active date ranges
- **Search & region filters** by kingdom name, trade partner, or cultural export
- **Details panel** with peak dates, capitals, trade partners, cultural exports, evidence type, and clickable primary source accounts
- **Light & dark mode**

## Data sources

Drawing on the **UNESCO General History of Africa** (volumes II–VI) and peer-reviewed archaeological research at sites including Aksum, Meroë, Great Zimbabwe, Jenne-jeno, Gao, Timbuktu, Ife, Benin City, and Mbanza Kongo. Primary textual accounts are linked where they survive — including Ibn Battuta, al-Bakri, Leo Africanus, the Periplus of the Erythraean Sea, the Ta'rikh al-Sudan, Afonso I's 1514 letter, and others.

Dates are approximate and reflect scholarly consensus, which is often debated; contested chronologies are flagged in each entry's summary. Points represent political/cultural centers, not exact borders. Territory polygons represent approximate peak extents, not precise boundaries.

## Run locally

This is a static site with no build step. Either open `index.html` directly in a browser, or serve the directory (recommended so the map tiles load cleanly):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Repository structure

```
african-time-atlas/
├── index.html        # App shell, controls, map + panel layout
├── css/
│   └── styles.css    # Earth-tone design system, light/dark mode
├── js/
│   ├── data.js        # All kingdom + territory + route data (sourced)
│   └── app.js         # Leaflet map, timeline, search, panel logic
├── .nojekyll          # Serve files as-is on GitHub Pages (skip Jekyll)
├── CITATION.cff      # Citation metadata (GitHub "Cite this repository")
├── LICENSE            # CC-BY 4.0
└── README.md
```

## Citation

If you use this atlas in your research, please cite both this repository and the companion paper, *African Time: A Dialogue on Time and Knowledge in African Thought* (Academia.edu):

```bibtex
@misc{african_kingdoms_atlas,
  title        = {African Kingdoms Atlas: Pre-Colonial States, 500--1850 CE},
  author       = {Alex Frigino},
  year         = {2026},
  howpublished = {\url{https://afrigino.github.io/african-time-atlas/}},
  note         = {Companion digital atlas to Alex Frigino, "African Time: A Dialogue on Time and Knowledge in African Thought" (Academia.edu, 2026), \url{https://www.academia.edu/144889366/African_Time_A_Dialogue_on_Time_and_Knowledge_in_African_Thought}.}
  license      = {CC-BY-4.0}
}
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for notable changes, including data and link fixes.

## License

© 2026 Alex Frigino. Licensed under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
