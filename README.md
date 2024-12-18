# Markdown/HTML Presentation Editor

A web-based editor for creating and editing content in both Markdown and HTML formats with real-time preview.

## Features

- Dual-mode editing (Markdown/HTML)
- Real-time preview
- Two-way conversion between Markdown and HTML
- Syntax highlighting
- Docker support

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd engineer-project-hub3
```

2. Start the application:
```bash
docker-compose up --build
```

3. Open your browser and navigate to:
```
http://localhost:5173
```

## Development

- The application is built using React and Vite
- Monaco Editor is used for code editing
- Marked is used for Markdown parsing
- TurndownService is used for HTML to Markdown conversion

## Project Structure

```
engineer-project-hub3/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   ├── Preview/
│   │   ├── TabSelector/
│   │   └── Toolbar/
│   ├── utils/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## License

[Your License]