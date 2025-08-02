
# PJSK SpineViewer - 3rd Anniversary Chibis

A specialized viewer for **Project Sekai's 3rd Anniversary Chibis**. This tool is designed exclusively for viewing and exporting animations from the v2 chibi files.

> **Note:** For the original v1 chibis and other characters, please visit the [original chibi viewer](https://prsk-chibi-viewer.vercel.app/).

## Features

- **Animation Viewer**: View all available chibi animations
- **GIF Export**: Export animations as high-quality GIFs

## Prerequisites

Before running this project, you'll need to extract the chibi files from the game:

- **Skeleton JSON files**: Available at [sekai.best](https://sekai.best/asset_viewer/area_sd/v2_sd_main/v2_base_model/)
- **Atlas files**: Can be exported using [sssekai](https://github.com/mos9527/sssekai)

> Huge thanks to the developers of these tools!

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/lmoadeck-Lunity/PJSK_SpineViewer.git
   cd PJSK_SpineViewer
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up chibi files:**
   
   Place your extracted chibi files in the `public/Files/out` directory with the following structure:

   ```text
   public/
   └── Files/
       ├── out/
       │   ├── v2_sd_01ichika_casual/
       │   │   └── sekai_atlas/
       │   │       ├── sekai_atlas.atlas.txt
       │   │       └── sekai_atlas.png
       │   ├── v2_sd_01ichika_school/
       │   │   └── sekai_atlas/
       │   │       ├── sekai_atlas.atlas.txt
       │   │       └── sekai_atlas.png
       │   └── ... (other character folders)
       └── skeleton/
           └── v2_sd_main.json
   ```

## Usage

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Open the application:**
   
   Navigate to `http://localhost:5173/` in your browser to start viewing chibis!

## Built With

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Spine Runtimes](http://esotericsoftware.com/spine-runtimes) - Animation rendering

## Acknowledgements

- Inspired by the original [v1 chibi viewer](https://prsk-chibi-viewer.vercel.app/)
- Special thanks to the [sekai.best](https://sekai.best/) and [sssekai](https://github.com/mos9527/sssekai) teams for their amazing tools
