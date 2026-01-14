# Whisper Web

Whisper-web is a webapplication that allows you to transcribe sound files to text completely locally in your web browser.

![A screenshot of the application](./screenshot.png)

## Credits

Original project created by [Xenova](https://github.com/xenova/whisper-web) (2023)

Swedish version by [Pierre Mesure](https://github.com/PierreMesure/whisper-web/tree/swedish) (2024)

Further developed and maintained by [Peter Wenström](https://www.linkedin.com/in/peter-wenstr%C3%B6m-99515450/) (2026)

Here are the main differences:

- Actively maintained
- Up-to-date dependencies, including transformers.js
- Ability to use WebGPU or CPU
- More user-friendly interface
- User interface in several languages
- Available as a progressive web app (so usable offline if added to your homescreen)
- Transcription is rendered continuously and not at the end
- Export to SRT
- Two-column desktop layout with writing area
- Stable scrolling (columns scroll independently, page doesn't jump)
- Spell checking enabled in writing area
- Prompt shortcut buttons to insert guidance quickly
- Status indicator under "Make the text useful" (busy/ready)
- Choose between a larger range of models (for example Swedish and Norwegian finetunes from the countries' national libraries)
- Choose your own quantization level for the model
- Clear cache with a button

The main application is available at [whisper-web.mesu.re](https://whisper-web.mesu.re). It is hosted on [statichost.eu](https://statichost.eu).

## KB-Whisper

Initially, this project aimed at making the [Swedish KB-Whisper models](https://huggingface.co/collections/KBLab/kb-whisper-67af9eafb24da903b63cc4aa) fine-tuned by the [Swedish National library](https://www.kb.se/samverkan-och-utveckling/nytt-fran-kb/nyheter-samverkan-och-utveckling/2025-02-20-valtranad-ai-modell-forvandlar-tal-till-text.html) ♥️ more available for easy transcription of Swedish audio.

A version of the website with Swedish as default language is still available at [kb-whisper.mesu.re](https://kb-whisper.mesu.re) (hosted in the EU by [statichost.eu](https://statichost.eu)) and the source code is on the [swedish branch](https://github.com/PierreMesure/whisper-web/tree/swedish) but it is identical to the other version at [whisper-web.mesu.re](https://whisper-web.mesu.re).

## Running locally

1. Clone the repo and install dependencies:

    ```bash
    git clone https://github.com/BUsavsjo/whisper-web.git
    cd whisper-web
    npm install
    ```

2. Run the development server:

    ```bash
    npm run dev
    ```

3. Open the link (e.g., [http://localhost:5173/](http://localhost:5173/)) in your browser.

## New UI Features

- Writing area with formatting helpers: bold, italic, bullet list, and quick reset to latest transcript.
- Spell check (`sv`) enabled in the writing area to help correct typos.
- Prompt shortcuts: insert predefined guidance blocks to prepare text for Copilot or other LLMs.
- Export tools: TXT, JSON (chunks), SRT and Copilot-ready text.
- Status indicator below the workspace title shows "Transkriberar..." while busy and "Klar!" when done.

## Tips

- On desktop, you can hide/show the writing area to focus on the transcript.
- Columns have independent scroll; the page height remains steady during transcription.
