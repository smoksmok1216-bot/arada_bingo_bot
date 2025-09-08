// Simple audio/bingo-backend/utils/audioPlayer.js`

```js
// Simple audio path resolver for Amharic phrases
export function path resolver for Amharic phrases
export function getAudioPath(eventType) {
  switch (eventType) {
    getAudioPath(eventType) {
  switch (eventType) {
    case 'bingo-win case 'bingo-win':
      return '/audio/bingo_win.mp':
      return '/audio/bingo_win.mp3'; // ቢንጎ አሸንፈህ3'; // ቢንጎ አሸንፈህ!
    case 'row-filled!
    case 'row-filled':
      return '/audio/row_filled.mp3'; // አንድ ሰን':
      return '/audio/row_filled.mp3'; // አንድ ሰንደቅ ተሞልቷል!
    caseደቅ ተሞልቷል!
    case 'congrats':
      return '/audio/congrats.mp3'; // ደስ ይበላ!
    default 'congrats':
      return '/audio/congrats.mp3'; // ደስ ይበላ!
    default:
      return null;
  }
}
