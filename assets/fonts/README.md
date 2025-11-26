# Custom Font Files

## Playfair Display SC (Required for Logo)

To use Playfair Display SC font for the "Cartridge" logo text, add the font file to this directory:

- `PlayfairDisplaySC-Regular.ttf` (or `.otf`)
- `PlayfairDisplaySC-Bold.ttf` (or `.otf`) - optional for bold variant

Once the font file is added, uncomment the Playfair Display SC font loading line in `App.js`:

```javascript
'PlayfairDisplaySC-Regular': require('./assets/fonts/PlayfairDisplaySC-Regular.ttf'),
'PlayfairDisplaySC-Bold': require('./assets/fonts/PlayfairDisplaySC-Bold.ttf'),
```

The font is used for:
- "Cartridge" text on the loading screen (displayed next to the logo)
- "Cartridge" text in the app header on all main screens

Note: Playfair Display SC is available under the SIL Open Font License and is free to use.

## Proxima Nova (Optional)

To use Proxima Nova font for numbers in rankings, add the following font files to this directory:

- `ProximaNova-Regular.otf` (or `.ttf`)
- `ProximaNova-Bold.otf` (or `.ttf`)

Once the font files are added, uncomment the Proxima Nova font loading lines in `App.js`.

The font will be used for:
- Rank numbers (#1, #2, etc.)
- Rating scores (8.5, 9.2, etc.)
- Statistics numbers (game counts, averages)
- Rating scores in comparison modals

Note: Proxima Nova is a commercial font. Make sure you have a license to use it in your application.

