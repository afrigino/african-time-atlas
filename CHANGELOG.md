# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- **Broken primary-source link**: the citation for *Letter from Afonso I, king of Kongo, to Manuel I, king of Portugal (1514)* pointed to `sites.miamioh.edu/empire/files/2022/08/1514-Letter-from-Afonso-I-to-Manuel-I.pdf`, which now 404s. The Miami University site relocated the file; updated the `primarySources` entry for the Kongo kingdom in `js/data.js` to the current path (`.../files/2026/01/1514-Letter-from-Afonso-I-to-Manuel-I.pdf`), confirmed live (HTTP 200). ([8f74fc3](https://github.com/afrigino/african-time-atlas/commit/8f74fc3))

## [1.0.0] - 2026-09-07

### Fixed

- Improved text legibility to meet WCAG AA contrast: light faint text `#a5926c` → `#7d6a47` (4.76:1), light accent gold `#b8862a` → `#7d5a16` (5.72:1), dark faint text `#7e6e52` → `#9a8a64` (5.02:1); source-type labels now use the `--color-accent-text` token; bumped source-type, marker, and route label sizes to a 12px floor. ([7db04e7](https://github.com/afrigino/african-time-atlas/commit/7db04e7))

### Added

- Companion paper reference to *African Time: A Dialogue on Time and Knowledge in African Thought* (Academia.edu). ([c35403d](https://github.com/afrigino/african-time-atlas/commit/c35403d))
- Author and license metadata (Alex Frigino, CC-BY-4.0). ([26cfcac](https://github.com/afrigino/african-time-atlas/commit/26cfcac))
- Initial release: interactive Leaflet.js atlas of 47 pre-colonial African states (500–1850 CE), with approximate peak-extent territory polygons for 16 empires and 12 trade routes. Sourced from the UNESCO *General History of Africa* (vols II–VI) and archaeological research. ([460d9fa](https://github.com/afrigino/african-time-atlas/commit/460d9fa))
