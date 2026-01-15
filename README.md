# Whisper Web (BUsavsjo)

🟢 Prova demon här:
👉 [https://busavsjo.github.io/whisper-web/](https://busavsjo.github.io/whisper-web/)

---

## Credits

* Originalprojekt skapat av **Xenova** (2023)
* Svensk version av **Pierre Mesure** (2024)
* Vidareutvecklad och underhållen av **Peter Wenström** (2026)

---

## Vad som har förändrats sedan originalet

* Projektet är aktivt underhållt
* Uppdaterade beroenden, inklusive `transformers.js`
* Stöd för WebGPU eller CPU
* Mer användarvänligt gränssnitt
* Gränssnitt tillgängligt på flera språk
* Finns som PWA (kan användas offline om den läggs till på hemskärmen)
* Transkriptionen visas löpande (inte först i slutet)
* Export till SRT
* Tvåkolumnslayout på desktop med skrivyta
* Stabil scrollning (kolumner scrollar oberoende)
* Stavningskontroll aktiverad i skrivytan
* Snabbknappar för att infoga guidande prompts
* Statusindikator under "Gör texten användbar" (visar "Transkriberar..." eller "Klar!")
* Stöd för fler modeller, t.ex. svenska och norska från respektive nationalbibliotek
* Möjlighet att välja kvantisering för modellen
* Töm cache med en knapp

---

## KB-Whisper

Detta projekt började som ett sätt att göra de svenska KB-Whisper-modellerna från Kungliga biblioteket ♥️ lättare att använda för transkribering av svensk ljudinspelning.

En version av webbappen med svenska som förvalt språk finns fortfarande på:
🔗 [kb-whisper.mesu.re](https://kb-whisper.mesu.re)
(Källkod på grenen `swedish`, identisk med [whisper-web.mesu.re](https://whisper-web.mesu.re))

---

## Köra lokalt

```bash
git clone git@github.com:BUsavsjo/whisper-web.git
cd whisper-web
npm install
npm run dev
```

Öppna sedan [http://localhost:5173/](http://localhost:5173/) i din webbläsare.
